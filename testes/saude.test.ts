import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { subir, type Aplicacao } from './ajuda.ts';

let app: Aplicacao;
before(async () => { app = await subir(); });
after(async () => { await app.fechar(); });

test('health responde 200 sem chave', async () => {
  const r = await app.pedir('/api/health', { chave: null });
  assert.equal(r.status, 200);
  const d = await r.json() as { estado: string; servico: string };
  assert.equal(d.estado, 'ok');
  assert.equal(d.servico, 'fio-raiz');
});

test('live e ready respondem', async () => {
  assert.equal((await app.pedir('/api/health/live', { chave: null })).status, 200);
  const pronto = await app.pedir('/api/health/ready', { chave: null });
  assert.deepEqual(await pronto.json(), { pronto: true, banco: 'ok' });
});

test('rota privada sem chave devolve 401', async () => {
  const r = await app.pedir('/api/sessions', { chave: null });
  assert.equal(r.status, 401);
  assert.equal((await r.json() as { erro: string }).erro, 'nao_autorizado');
});

test('rota inexistente devolve 404 com erro nomeado', async () => {
  const r = await app.pedir('/api/nao-existe');
  assert.equal(r.status, 404);
  assert.equal((await r.json() as { erro: string }).erro, 'rota_desconhecida');
});
