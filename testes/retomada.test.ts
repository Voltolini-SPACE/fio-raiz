import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { criarAplicacao } from '../src/servidor.ts';
import * as svc from '../src/nucleo/servicos.ts';

test('boot retoma só a sessão que estava conectada', async () => {
  const pasta = mkdtempSync(join(tmpdir(), 'fio-raiz-retomada-'));
  const semente = criarAplicacao({ pastaDados: pasta });
  const viva = svc.criarSessao(semente.banco, 'Viva', 'simulado');
  const parada = svc.criarSessao(semente.banco, 'Parada', 'simulado');
  const lendo = svc.criarSessao(semente.banco, 'Lendo', 'simulado');
  svc.registrarEstado(semente.banco, viva.id, 'conectada', null);
  svc.registrarEstado(semente.banco, lendo.id, 'aguardando_qr', 'fio:abc');
  await new Promise<void>((ok) => semente.servidor.close(() => ok()));
  semente.banco.close();
  const app = criarAplicacao({ pastaDados: pasta });
  try {
    await new Promise((ok) => setTimeout(ok, 30));
    const estado = (id: string) => (app.banco.prepare('SELECT estado FROM sessoes WHERE id = ?').get(id) as { estado: string }).estado;
    assert.equal(estado(viva.id), 'conectada');
    assert.equal(estado(lendo.id), 'parada');
    assert.equal(estado(parada.id), 'criada');
  } finally {
    await new Promise<void>((ok) => app.servidor.close(() => ok()));
    app.banco.close();
    rmSync(pasta, { recursive: true, force: true });
  }
});
