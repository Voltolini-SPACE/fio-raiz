import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { subir, type Aplicacao } from './ajuda.ts';

let app: Aplicacao;
before(async () => { app = await subir(); });
after(async () => { await app.fechar(); });

async function novaSessao(nome = 'Atendimento'): Promise<string> {
  const r = await app.pedir('/api/sessions', { metodo: 'POST', corpo: { nome } });
  assert.equal(r.status, 200);
  return (await r.json() as { id: string }).id;
}

test('criar lista e obter sessão', async () => {
  const id = await novaSessao('Vendas');
  const lista = await (await app.pedir('/api/sessions')).json() as { itens: Array<{ id: string; nome: string; estado: string }> };
  const achada = lista.itens.find((s) => s.id === id);
  assert.ok(achada);
  assert.equal(achada?.estado, 'criada');
  const uma = await (await app.pedir(`/api/sessions/${id}`)).json() as { nome: string };
  assert.equal(uma.nome, 'Vendas');
});

test('iniciar conecta, gera QR e permite envio', async () => {
  const id = await novaSessao();
  const iniciada = await (await app.pedir(`/api/sessions/${id}/start`, { metodo: 'POST' })).json() as { estado: string };
  assert.equal(iniciada.estado, 'conectada');
  const qr = await (await app.pedir(`/api/sessions/${id}/qr`)).json() as { qr: string };
  assert.match(qr.qr, /^fio:[0-9a-f]{32}$/);
  const envio = await app.pedir(`/api/sessions/${id}/messages/send-text`, {
    metodo: 'POST', corpo: { para: '5511999998888', texto: 'olá' },
  });
  assert.equal(envio.status, 200);
  const mensagem = await envio.json() as { conversa: string; tipo: string; estado: string };
  assert.equal(mensagem.conversa, '5511999998888@s.whatsapp.net');
  assert.equal(mensagem.tipo, 'texto');
  assert.equal(mensagem.estado, 'enviada');
  const lista = await (await app.pedir(`/api/sessions/${id}/messages`)).json() as { itens: unknown[] };
  assert.equal(lista.itens.length, 1);
});

test('enviar em sessão parada devolve 409', async () => {
  const id = await novaSessao('Parada');
  await app.pedir(`/api/sessions/${id}/start`, { metodo: 'POST' });
  await app.pedir(`/api/sessions/${id}/stop`, { metodo: 'POST' });
  const r = await app.pedir(`/api/sessions/${id}/messages/send-text`, {
    metodo: 'POST', corpo: { para: '5511999998888', texto: 'x' },
  });
  assert.equal(r.status, 409);
});

test('pareamento grava número e status reflete', async () => {
  const id = await novaSessao('Pareada');
  await app.pedir(`/api/sessions/${id}/pair`, { metodo: 'POST', corpo: { numero: '5511888887777' } });
  const status = await (await app.pedir(`/api/sessions/${id}/status`)).json() as { estado: string; numero: string };
  assert.equal(status.estado, 'conectada');
  assert.equal(status.numero, '5511888887777');
});

test('send-media exige URL e grava legenda', async () => {
  const id = await novaSessao('Mídia');
  await app.pedir(`/api/sessions/${id}/start`, { metodo: 'POST' });
  const ruim = await app.pedir(`/api/sessions/${id}/messages/send-media`, {
    metodo: 'POST', corpo: { para: '5511999998888', midia: 'ftp://x' },
  });
  assert.equal(ruim.status, 400);
  const bom = await app.pedir(`/api/sessions/${id}/messages/send-media`, {
    metodo: 'POST', corpo: { para: '5511999998888', midia: 'https://exemplo.test/a.png', legenda: 'foto' },
  });
  assert.equal(bom.status, 200);
  const corpo = await bom.json() as { tipo: string; midia: string; corpo: string };
  assert.equal(corpo.tipo, 'midia');
  assert.equal(corpo.corpo, 'foto');
});

test('remover sessão apaga mensagens e devolve 404 depois', async () => {
  const id = await novaSessao('Temporária');
  await app.pedir(`/api/sessions/${id}/start`, { metodo: 'POST' });
  await app.pedir(`/api/sessions/${id}/messages/send-text`, { metodo: 'POST', corpo: { para: '5511999998888', texto: 'oi' } });
  assert.equal((await app.pedir(`/api/sessions/${id}`, { metodo: 'DELETE' })).status, 200);
  assert.equal((await app.pedir(`/api/sessions/${id}`)).status, 404);
});

test('contatos, etiquetas e grupos aceitam leitura e escrita de contato', async () => {
  const id = await novaSessao('Contatos');
  const criado = await app.pedir(`/api/sessions/${id}/contacts`, {
    metodo: 'POST', corpo: { jid: '5511977776666', nome: 'Ana' },
  });
  assert.equal(criado.status, 200);
  const contatos = await (await app.pedir(`/api/sessions/${id}/contacts`)).json() as { itens: Array<{ nome: string }> };
  assert.equal(contatos.itens[0]?.nome, 'Ana');
  assert.equal((await app.pedir(`/api/sessions/${id}/labels`)).status, 200);
  assert.equal((await app.pedir(`/api/sessions/${id}/groups`)).status, 200);
});
