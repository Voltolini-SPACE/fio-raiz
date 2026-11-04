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
