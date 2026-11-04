import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { subir, type Aplicacao } from './ajuda.ts';

let app: Aplicacao;
let sessaoId = '';

before(async () => {
  app = await subir();
  const sessao = await (await app.pedir('/api/sessions', { metodo: 'POST', corpo: { nome: 'Busca' } })).json() as { id: string };
  sessaoId = sessao.id;
  await app.pedir(`/api/sessions/${sessaoId}/start`, { metodo: 'POST' });
  await app.pedir(`/api/sessions/${sessaoId}/messages/send-text`, { metodo: 'POST',
    corpo: { para: '5511999997777', texto: 'orquídea azul' } });
  await app.pedir(`/api/sessions/${sessaoId}/messages/send-media`, { metodo: 'POST',
    corpo: { para: '5511999997777', midia: 'https://exemplo.test/foto.jpg', legenda: 'foto' } });
});
after(async () => { await app.fechar(); });

test('busca encontra mensagem por trecho', async () => {
  const r = await app.pedir('/api/search?q=orquídea');
  assert.equal(r.status, 200);
  const d = await r.json() as { termo: string; mensagens: Array<{ corpo: string }> };
  assert.equal(d.termo, 'orquídea');
  assert.ok(d.mensagens.some((m) => m.corpo === 'orquídea azul'));
});

test('busca curta e vazia são recusadas', async () => {
  assert.equal((await app.pedir('/api/search?q=a')).status, 400);
  assert.equal((await app.pedir('/api/search')).status, 400);
});

test('visão geral conta sessão e mensagens', async () => {
  const d = await (await app.pedir('/api/stats/overview')).json() as Record<string, number>;
  assert.ok((d.sessoes ?? 0) >= 1);
  assert.ok((d.mensagens ?? 0) >= 2);
  assert.ok((d.conectadas ?? 0) >= 1);
});

test('estatísticas de mensagens filtram por sessão', async () => {
  const d = await (await app.pedir(`/api/stats/messages?sessao_id=${sessaoId}`)).json() as { por_tipo?: unknown; total?: number };
  assert.ok(JSON.stringify(d).length > 2);
  const outra = await app.pedir('/api/stats/messages?sessao_id=ses_inexistente');
  assert.equal(outra.status, 200);
});
