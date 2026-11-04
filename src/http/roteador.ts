import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Banco } from '../nucleo/banco.ts';
import type { Motor } from '../motor/porta.ts';

export interface Contexto {
  req: IncomingMessage;
  res: ServerResponse;
  params: Record<string, string>;
  query: URLSearchParams;
  corpo: unknown;
  banco: Banco;
  motor: Motor;
  chaveApresentada: string | undefined;
}

export type Manipulador = (c: Contexto) => Promise<unknown> | unknown;

export interface Rota {
  metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  padrao: string;
  publica?: boolean;
  tratar: Manipulador;
}

/** Casa `/api/sessions/:id/qr` com `/api/sessions/abc/qr` devolvendo `{id:'abc'}`. */
export function casar(padrao: string, caminho: string): Record<string, string> | null {
  const a = padrao.split('/').filter(Boolean);
  const b = caminho.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i += 1) {
    const parte = a[i] as string;
    const alvo = b[i] as string;
    if (parte.startsWith(':')) {
      if (!alvo) return null;
      params[parte.slice(1)] = decodeURIComponent(alvo);
    } else if (parte !== alvo) {
      return null;
    }
  }
  return params;
}

export function procurar(rotas: Rota[], metodo: string, caminho: string): { rota: Rota; params: Record<string, string> } | null {
  for (const rota of rotas) {
    if (rota.metodo !== metodo) continue;
    const params = casar(rota.padrao, caminho);
    if (params) return { rota, params };
  }
  return null;
}
