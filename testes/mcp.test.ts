import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { subir, type Aplicacao } from './ajuda.ts';

let app: Aplicacao;
before(async () => { app = await subir(); });
after(async () => { await app.fechar(); });

const chamar = (app: Aplicacao, corpo: unknown, chave?: string | null) =>
  app.pedir('/mcp', { metodo: 'POST', corpo, chave });

test('initialize devolve servidor e capacidades', async () => {
  const r = await chamar(app, { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
  assert.equal(r.status, 200);
  const d = await r.json() as { result: { serverInfo: { name: string }; capabilities: { tools: unknown } } };
  assert.equal(d.result.serverInfo.name, 'fio-raiz');
  assert.ok(d.result.capabilities.tools);
});

test('tools/list traz as ferramentas com schema', async () => {
  const d = await (await chamar(app, { jsonrpc: '2.0', id: 2, method: 'tools/list' })).json() as {
    result: { tools: Array<{ name: string; inputSchema: unknown }> } };
  const nomes = d.result.tools.map((t) => t.name);
  assert.ok(nomes.includes('SessionFindAll'));
  assert.ok(nomes.includes('MessageSendText'));
  assert.ok(nomes.length >= 10);
});

test('tools/call executa SessionFindAll', async () => {
  const d = await (await chamar(app, { jsonrpc: '2.0', id: 3, method: 'tools/call',
    params: { name: 'SessionFindAll', arguments: {} } })).json() as { result: { content: Array<{ text: string }>; isError: boolean } };
  assert.equal(d.result.isError, false);
  const saida = JSON.parse(d.result.content[0]?.text ?? '{}') as { itens: unknown[] };
  assert.ok(Array.isArray(saida.itens));
});

test('ferramenta desconhecida vira erro JSON-RPC', async () => {
  const d = await (await chamar(app, { jsonrpc: '2.0', id: 4, method: 'tools/call',
    params: { name: 'NaoExiste', arguments: {} } })).json() as { error: { code: number } };
  assert.equal(d.error.code, -32602);
});

test('MCP sem chave devolve 401', async () => {
  assert.equal((await chamar(app, { jsonrpc: '2.0', id: 5, method: 'tools/list' }, null)).status, 401);
});
