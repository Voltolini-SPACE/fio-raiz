import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { subir, type Aplicacao } from './ajuda.ts';

let app: Aplicacao;
before(async () => { app = await subir(); });
after(async () => { await app.fechar(); });

test('painel entrega HTML próprio sem build', async () => {
  const r = await app.pedir('/painel', { chave: null });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type') ?? '', /text\/html/);
  const html = await r.text();
  assert.match(html, /Fio <span>Raiz/);
  assert.match(html, /\/api\/stats\/overview/);
});
