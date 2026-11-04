/** Escolha do motor: simulado por padrão; `FIO_RAIZ_MOTOR=baileys` liga o transporte real. */
import { criarMotorBaileys, type ObservadorMotor } from './baileys.ts';
import type { Motor } from './porta.ts';
import { MotorSimulado } from './simulado.ts';

export function criarMotor(opcoes: {
  pastaDados: string;
  observador: ObservadorMotor;
  ambiente?: NodeJS.ProcessEnv;
}): Motor {
  const ambiente = opcoes.ambiente ?? process.env;
  if (ambiente.FIO_RAIZ_MOTOR === 'baileys') {
    return criarMotorBaileys({ pastaDados: opcoes.pastaDados, observador: opcoes.observador });
  }
  return new MotorSimulado();
}

export type { ObservadorMotor };
