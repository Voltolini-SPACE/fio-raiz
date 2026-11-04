import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { connect } from 'node:net';
import { createHmac } from 'node:crypto';
import { mkdtempSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { subir, type Aplicacao } from './ajuda.ts';
import { criarAplicacao } from '../src/servidor.ts';
import * as svc from '../src/nucleo/servicos.ts';

let app: Aplicacao;
before(async () => { app = await subir(); });
after(async () => { await app.fechar(); });

function cru(porta: number, pedido: string): Promise<string> {
  return new Promise((ok, falha) => {
    const s = connect(porta, '127.0.0.1', () => s.end(pedido));
    let dados = '';
    s.on('data', (p) => { dados += p; });
    s.on('end', () => ok(dados));
    s.on('error', falha);
  });
}

test('Host malformado não derruba o processo', async () => {
  const porta = Number(new URL(app.url).port);
  const r = await cru(porta, 'GET /api/health HTTP/1.1\r\nHost: a b\r\nConnection: close\r\n\r\n');
  assert.match(r, /^HTTP\/1\.1 \d{3}/);
  assert.equal((await app.pedir('/api/health')).status, 200);
});

test('falha não tratada vira -32603 sem vazar mensagem interna', async () => {
  const quebrado = await subir({ motor: {
    nome: 'quebrado',
    iniciar: async () => ({ estado: 'conectada' as const }),
    parar: async () => 'parada' as const,
    enviarTexto: async () => { throw new Error('segredo token=abc123'); },
    enviarMidia: async () => ({ id: 'x' }),
  } });
  try {
    const sessao = await (await quebrado.pedir('/api/sessions', { metodo: 'POST', corpo: { nome: 'S' } })).json() as { id: string };
    await quebrado.pedir(`/api/sessions/${sessao.id}/start`, { metodo: 'POST' });
    const r = await quebrado.pedir('/mcp', { metodo: 'POST', corpo: { jsonrpc: '2.0', id: 9, method: 'tools/call',
      params: { name: 'MessageSendText', arguments: { sessionId: sessao.id, to: '5511999999999', text: 'oi' } } } });
    const d = await r.json() as { error?: { code: number; message: string } };
    assert.equal(d.error?.code, -32603);
    assert.ok(!(d.error?.message ?? '').includes('segredo'));
  } finally { await quebrado.fechar(); }
});

test('webhook para rede privada é recusado', async () => {
  const anterior = process.env.FIO_RAIZ_WEBHOOK_LOCAL;
  delete process.env.FIO_RAIZ_WEBHOOK_LOCAL;
  try {
    for (const url of ['http://127.0.0.1:9/x', 'http://localhost/x', 'http://10.0.0.5/x', 'http://169.254.169.254/latest']) {
      const r = await app.pedir('/api/webhooks', { metodo: 'POST', corpo: { url, eventos: ['*'] } });
      assert.equal(r.status, 400, url);
    }
    const ok = await app.pedir('/api/webhooks', { metodo: 'POST', corpo: { url: 'https://example.com/hook', eventos: ['*'] } });
    assert.equal(ok.status, 200);
  } finally { if (anterior !== undefined) process.env.FIO_RAIZ_WEBHOOK_LOCAL = anterior; }
});

test('webhook assina com HMAC do corpo', async () => {
  const recebidos: Array<{ corpo: string; assinatura: string }> = [];
  const receptor = createServer((req, res) => {
    let corpo = '';
    req.on('data', (p) => { corpo += p; });
    req.on('end', () => { recebidos.push({ corpo, assinatura: String(req.headers['x-fio-assinatura']) }); res.writeHead(200).end('ok'); });
  });
  await new Promise<void>((ok) => receptor.listen(0, '127.0.0.1', ok));
  const porta = (receptor.address() as AddressInfo).port;
  try {
    const criado = await (await app.pedir('/api/webhooks', { metodo: 'POST',
      corpo: { url: `http://127.0.0.1:${porta}/h`, eventos: ['*'] } })).json() as { id: string; segredo: string };
    const sessao = await (await app.pedir('/api/sessions', { metodo: 'POST', corpo: { nome: 'W' } })).json() as { id: string };
    await app.pedir(`/api/sessions/${sessao.id}/start`, { metodo: 'POST' });
    await app.pedir(`/api/sessions/${sessao.id}/messages/send-text`, { metodo: 'POST',
      corpo: { para: '5511999999999', texto: 'oi' } });
    assert.equal(recebidos.length, 1);
    const esperado = `sha256=${createHmac('sha256', criado.segredo).update(recebidos[0]?.corpo ?? '').digest('hex')}`;
    assert.equal(recebidos[0]?.assinatura, esperado);
    await app.pedir(`/api/webhooks/${criado.id}`, { metodo: 'DELETE' });
  } finally { receptor.close(); }
});

test('reinício devolve sessões ao estado parada', async () => {
  const pasta = mkdtempSync(join(tmpdir(), 'fio-reinicio-'));
  const primeiro = criarAplicacao({ pastaDados: pasta });
  const sessao = svc.criarSessao(primeiro.banco, 'R');
  primeiro.banco.prepare("UPDATE sessoes SET estado = 'conectada' WHERE id = ?").run(sessao.id);
  await new Promise<void>((ok) => primeiro.servidor.close(() => ok()));
  primeiro.banco.close();
  const segundo = criarAplicacao({ pastaDados: pasta });
  try {
    const lista = svc.listarSessoes(segundo.banco);
    assert.equal(lista[0]?.estado, 'parada');
  } finally {
    await new Promise<void>((ok) => segundo.servidor.close(() => ok()));
    segundo.banco.close();
    rmSync(pasta, { recursive: true, force: true });
  }
});

test('força bruta de chave recebe 429', async () => {
  const codigos: number[] = [];
  for (let i = 0; i < 25; i += 1) {
    codigos.push((await app.pedir('/api/sessions', { chave: `errada-${i}` })).status);
  }
  assert.ok(codigos.includes(429), `sem 429: ${codigos.slice(-3)}`);
});

test('caminho com % solto é 400, não 500', async () => {
  const r = await app.pedir('/api/sessions/%');
  assert.equal(r.status, 400);
});

test('lista de sessões não devolve o QR', async () => {
  const d = await (await app.pedir('/api/sessions')).json() as { itens: Array<Record<string, unknown>> };
  assert.ok(d.itens.length > 0);
  assert.ok(d.itens.every((s) => !('qr' in s)));
});

test('inteiro não aceita notação exótica', async () => {
  assert.equal((await app.pedir('/api/sessions/x/messages?limite=0x10')).status, 400);
});

test('painel vem com cabeçalhos de segurança', async () => {
  const r = await app.pedir('/painel');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy') ?? '', /default-src 'self'/);
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.match(r.headers.get('referrer-policy') ?? '', /no-referrer/);
});

test('apagar sessão remove credenciais do disco', async () => {
  const sessao = await (await app.pedir('/api/sessions', { metodo: 'POST', corpo: { nome: 'D' } })).json() as { id: string };
  const pasta = join(app.pasta, 'sessoes', sessao.id, 'auth');
  mkdirSync(pasta, { recursive: true });
  await app.pedir(`/api/sessions/${sessao.id}`, { metodo: 'DELETE' });
  assert.equal(existsSync(join(app.pasta, 'sessoes', sessao.id)), false);
});
