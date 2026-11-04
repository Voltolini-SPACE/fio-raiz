import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MotorIndisponivel } from '../src/motor/baileys.ts';
import type { Motor } from '../src/motor/porta.ts';
import { criarMotor } from '../src/motor/selecao.ts';
import { subir } from './ajuda.ts';

const observador = { aoMudarEstado: () => undefined, aoReceber: () => undefined };

test('sem variável de ambiente o motor é o simulado', () => {
  const motor = criarMotor({ pastaDados: '/tmp/fio-raiz-selecao', observador, ambiente: {} });
  assert.equal(motor.nome, 'simulado');
});

test('FIO_RAIZ_MOTOR=baileys escolhe o motor real', () => {
  const motor = criarMotor({
    pastaDados: '/tmp/fio-raiz-selecao',
    observador,
    ambiente: { FIO_RAIZ_MOTOR: 'baileys' },
  });
  assert.equal(motor.nome, 'baileys');
});

test('biblioteca ausente responde 503 com instrução, não 500', async () => {
  const quebrado: Motor = {
    nome: 'baileys',
    iniciar: async () => { throw new MotorIndisponivel(); },
    parar: async () => 'parada' as const,
    enviarTexto: async () => ({ id: 'x' }),
    enviarMidia: async () => ({ id: 'x' }),
  };
  const app = await subir({ motor: () => quebrado });
  try {
    const criada = await (await app.pedir('/api/sessions', { metodo: 'POST', corpo: { nome: 'Sem lib' } })).json() as { id: string };
    const resposta = await app.pedir(`/api/sessions/${criada.id}/start`, { metodo: 'POST' });
    assert.equal(resposta.status, 503);
    const corpo = await resposta.json() as { erro: string; mensagem: string };
    assert.equal(corpo.erro, 'motor_indisponivel');
    assert.match(corpo.mensagem, /npm i baileys@7\.0\.0-rc14/);
  } finally {
    await app.fechar();
  }
});
