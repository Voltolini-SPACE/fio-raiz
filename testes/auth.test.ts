import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { subir, type Aplicacao } from './ajuda.ts';

let app: Aplicacao;
before(async () => { app = await subir(); });
after(async () => { await app.fechar(); });

test('chave da máquina nasce em arquivo 0600', () => {
  const arquivo = join(app.pasta, '.api-key');
  assert.match(app.chave, /^fio_[0-9a-f]{48}$/);
  assert.equal(readFileSync(arquivo, 'utf8').trim(), app.chave);
  assert.equal(statSync(arquivo).mode & 0o777, 0o600);
});

test('validate aceita a chave certa e recusa a errada', async () => {
  assert.equal((await app.pedir('/api/auth/validate', { metodo: 'POST' })).status, 200);
  const ruim = await app.pedir('/api/auth/validate', { metodo: 'POST', chave: 'fio_errada_000000000000000000000000' });
  assert.equal(ruim.status, 401);
});

test('criar, revogar e remover chave de API', async () => {
  const criada = await app.pedir('/api/auth/api-keys', { metodo: 'POST', corpo: { nome: 'teste' } });
  assert.equal(criada.status, 200);
  const { id, chave } = await criada.json() as { id: string; chave: string };
  assert.equal((await app.pedir('/api/sessions', { chave })).status, 200);
  assert.equal((await app.pedir(`/api/auth/api-keys/${id}/revoke`, { metodo: 'POST' })).status, 200);
  assert.equal((await app.pedir('/api/sessions', { chave })).status, 401);
  assert.equal((await app.pedir(`/api/auth/api-keys/${id}`, { metodo: 'DELETE' })).status, 200);
  assert.equal((await app.pedir(`/api/auth/api-keys/${id}`)).status, 404);
});

test('settings grava e lê objeto', async () => {
  const gravado = await app.pedir('/api/settings', { metodo: 'PUT', corpo: { tema: 'raiz', mcp: { ativo: true } } });
  assert.equal(gravado.status, 200);
  const lido = await (await app.pedir('/api/settings')).json() as { tema: string; mcp: { ativo: boolean } };
  assert.equal(lido.tema, 'raiz');
  assert.equal(lido.mcp.ativo, true);
});
