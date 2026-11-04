import { invalido } from './erros.ts';

export function texto(valor: unknown, campo: string, { min = 1, max = 4096 } = {}): string {
  if (typeof valor !== 'string') throw invalido(`${campo} deve ser texto`);
  const limpo = valor.trim();
  if (limpo.length < min) throw invalido(`${campo} é obrigatório`);
  if (limpo.length > max) throw invalido(`${campo} passa de ${max} caracteres`);
  return limpo;
}

export function textoOpcional(valor: unknown, campo: string, { max = 4096 } = {}): string | undefined {
  if (valor === undefined || valor === null || valor === '') return undefined;
  return texto(valor, campo, { max });
}

export function inteiro(valor: unknown, campo: string, {min = 0, max = 500} = {}): number {
  if (typeof valor === 'string' && !/^-?\d+$/.test(valor)) throw invalido(`${campo} deve ser inteiro entre ${min} e ${max}`);
  const n = typeof valor === 'string' ? Number(valor) : valor;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    throw invalido(`${campo} deve ser inteiro entre ${min} e ${max}`);
  }
  return n;
}

export function objeto(valor: unknown, campo: string): Record<string, unknown> {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw invalido(`${campo} deve ser objeto`);
  }
  return valor as Record<string, unknown>;
}

export function jid(valor: unknown, campo = 'jid'): string {
  const bruto = texto(valor, campo, { max: 80 });
  if (!/^\d{8,20}(@(s\.whatsapp\.net|g\.us))?$/.test(bruto)) throw invalido(`${campo} inválido`);
  return bruto.includes('@') ? bruto : `${bruto}@s.whatsapp.net`;
}

const PRIVADOS = [/^127\./, /^10\./, /^192\.168\./, /^169\.254\./, /^0\./, /^\[?::1\]?$/];
const FAIXA_172 = /^172\.(1[6-9]|2\d|3[01])\./;

/** Webhook só fala com a internet pública: barra loopback, rede privada e metadados de nuvem (SSRF). */
export function validarUrlPublica(url: string): string {
  let alvo: URL;
  try { alvo = new URL(url); } catch { throw invalido('url inválida'); }
  if (alvo.protocol !== 'http:' && alvo.protocol !== 'https:') throw invalido('url deve ser http(s)');
  const host = alvo.hostname.toLowerCase();
  const permitirLocal = process.env.FIO_RAIZ_WEBHOOK_LOCAL === '1';
  const privado = host === 'localhost' || host.endsWith('.localhost')
    || PRIVADOS.some((r) => r.test(host)) || FAIXA_172.test(host);
  if (privado && !permitirLocal) throw invalido('url aponta para rede privada; webhooks exigem destino público');
  return alvo.toString();
}
