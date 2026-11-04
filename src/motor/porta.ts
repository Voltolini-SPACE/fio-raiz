/** Porta do transporte de WhatsApp. O núcleo não conhece biblioteca de terceiro. */
export type EstadoSessao = 'criada' | 'iniciando' | 'aguardando_qr' | 'conectada' | 'parada' | 'erro';

export interface Motor {
  readonly nome: string;
  iniciar(sessaoId: string): Promise<{ estado: EstadoSessao; qr?: string }>;
  parar(sessaoId: string): Promise<EstadoSessao>;
  enviarTexto(sessaoId: string, conversa: string, corpo: string): Promise<{ id: string }>;
  enviarMidia(sessaoId: string, conversa: string, midia: string, legenda?: string): Promise<{ id: string }>;
}
