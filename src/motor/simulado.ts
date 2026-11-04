import { createHash, randomUUID } from 'node:crypto';
import type { EstadoSessao, Motor } from './porta.ts';

/** Motor de desenvolvimento: sem rede, sem telefone. Cada sessão nasce conectada e com QR registrado. */
export class MotorSimulado implements Motor {
  readonly nome = 'simulado';
  private readonly estados = new Map<string, EstadoSessao>();

  async iniciar(sessaoId: string): Promise<{ estado: EstadoSessao; qr?: string }> {
    const qr = `fio:${createHash('sha256').update(`qr:${sessaoId}`).digest('hex').slice(0, 32)}`;
    this.estados.set(sessaoId, 'conectada');
    return { estado: 'conectada', qr };
  }

  async parar(sessaoId: string): Promise<EstadoSessao> {
    this.estados.set(sessaoId, 'parada');
    return 'parada';
  }

  estado(sessaoId: string): EstadoSessao {
    return this.estados.get(sessaoId) ?? 'criada';
  }

  async enviarTexto(sessaoId: string, _conversa: string, _corpo: string): Promise<{ id: string }> {
    this.exigirConectada(sessaoId);
    return { id: `msg_${randomUUID()}` };
  }

  async enviarMidia(sessaoId: string, _conversa: string, _midia: string, _legenda?: string) {
    this.exigirConectada(sessaoId);
    return { id: `msg_${randomUUID()}` };
  }

  private exigirConectada(sessaoId: string): void {
    if (this.estado(sessaoId) !== 'conectada') {
      throw new Error('sessão não conectada');
    }
  }
}
