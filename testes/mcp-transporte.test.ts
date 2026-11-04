import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { subir, type Aplicacao } from './ajuda.ts';

let app: Aplicacao;
before(async () => { app = await subir(); });
after(async () => { await app.fechar(); });

const postar = (corpo: unknown, cabecalhos: Record<string, string> = {}) =>
  app.pedir('/mcp', { metodo: 'POST', corpo, cabecalhos });

test('notificação recebe 202 sem corpo', async () => {
  const r = await postar({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(r.status, 202);
  assert.equal(await r.text(), '');
});

test('MCP-Protocol-Version incompatível devolve 400', async () => {
  const r = await postar({ jsonrpc: '2.0', id: 1, method: 'ping' }, { 'mcp-protocol-version': '2099-01-01' });
  assert.equal(r.status, 400);
  const d = await r.json() as { erro: string };
  assert.equal(d.erro, 'protocolo_incompativel');
});

test('MCP-Protocol-Version correto passa', async () => {
  const r = await postar({ jsonrpc: '2.0', id: 1, method: 'ping' }, { 'mcp-protocol-version': '2025-06-18' });
  assert.equal(r.status, 200);
});

test('Content-Type não JSON devolve 415', async () => {
  const r = await app.pedir('/mcp', { metodo: 'POST', bruto: '{"jsonrpc":"2.0","id":1,"method":"ping"}',
    cabecalhos: { 'content-type': 'text/plain' } });
  assert.equal(r.status, 415);
});

test('Origin externa é recusada e local aceita', async () => {
  const mal = await postar({ jsonrpc: '2.0', id: 1, method: 'ping' }, { origin: 'http://evil.example' });
  assert.equal(mal.status, 403);
  const bom = await postar({ jsonrpc: '2.0', id: 2, method: 'ping' }, { origin: 'http://127.0.0.1:2790' });
  assert.equal(bom.status, 200);
});

test('401 traz WWW-Authenticate', async () => {
  const r = await app.pedir('/mcp', { metodo: 'POST', corpo: { jsonrpc: '2.0', id: 1, method: 'ping' }, chave: null });
  assert.equal(r.status, 401);
  assert.match(r.headers.get('www-authenticate') ?? '', /ApiKey/);
});

test('GET e DELETE em /mcp devolvem 405 com Allow', async () => {
  const g = await app.pedir('/mcp');
  assert.equal(g.status, 405);
  assert.match(g.headers.get('allow') ?? '', /POST/);
  const d = await app.pedir('/mcp', { metodo: 'DELETE' });
  assert.equal(d.status, 405);
});

test('método desconhecido usa -32601', async () => {
  const r = await postar({ jsonrpc: '2.0', id: 1, method: 'resources/list' });
  const d = await r.json() as { error: { code: number } };
  assert.equal(d.error.code, -32601);
});
