/** Tradução pura dos eventos do transporte para o vocabulário do Fio.

Nenhuma biblioteca de terceiro é importada aqui: os objetos chegam como dados e são lidos
por forma. Isso permite testar o mapeamento sem rede e sem telefone.
*/
import type { EstadoSessao } from './porta.ts';

export interface MensagemEntrada {
  id: string;
  conversa: string;
  tipo: 'texto' | 'midia';
  corpo: string | null;
  midia: string | null;
  recebida_em: number;
}

export interface AtualizacaoTraduzida {
  estado?: EstadoSessao;
  qr?: string | null;
  reconectar?: boolean;
}

const DESLOGADO = new Set([401, 403, 405]);

function textoDe(valor: unknown): string | null {
  return typeof valor === 'string' && valor.length > 0 ? valor : null;
}

function emMilissegundos(valor: unknown): number {
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor < 1e12 ? Math.round(valor * 1000) : Math.round(valor);
  }
  if (valor && typeof valor === 'object') {
    const baixo = (valor as { low?: number }).low;
    if (typeof baixo === 'number') return baixo * 1000;
  }
  return Date.now();
}

export function traduzirAtualizacao(update: unknown): AtualizacaoTraduzida {
  const u = (update ?? {}) as {
    connection?: string; qr?: string;
    lastDisconnect?: { error?: { output?: { statusCode?: number } } };
  };
  if (textoDe(u.qr)) return { estado: 'aguardando_qr', qr: u.qr as string };
  if (u.connection === 'open') return { estado: 'conectada', qr: null };
  if (u.connection === 'connecting') return { estado: 'iniciando' };
  if (u.connection === 'close') {
    const codigo = u.lastDisconnect?.error?.output?.statusCode;
    const deslogado = typeof codigo === 'number' && DESLOGADO.has(codigo);
    return { estado: deslogado ? 'erro' : 'iniciando', reconectar: !deslogado };
  }
  return {};
}

interface ConteudoWhatsApp {
  conversation?: string;
  extendedTextMessage?: { text?: string };
  imageMessage?: { caption?: string };
  videoMessage?: { caption?: string };
  documentMessage?: { caption?: string; fileName?: string };
  audioMessage?: { ptt?: boolean };
}

export function traduzirMensagem(mensagem: unknown): MensagemEntrada | null {
  const m = (mensagem ?? {}) as {
    key?: { remoteJid?: string; fromMe?: boolean; id?: string };
    message?: ConteudoWhatsApp; messageTimestamp?: unknown;
  };
  const chave = m.key;
  if (!chave?.remoteJid || chave.fromMe) return null;
  const id = textoDe(chave.id);
  const conteudo = m.message;
  if (!id || !conteudo) return null;
  const recebida_em = emMilissegundos(m.messageTimestamp);
  const base = { id, conversa: chave.remoteJid, recebida_em };

  const simples = textoDe(conteudo.conversation) ?? textoDe(conteudo.extendedTextMessage?.text);
  if (simples) return { ...base, tipo: 'texto', corpo: simples, midia: null };

  const midia = conteudo.imageMessage ?? conteudo.videoMessage
    ?? conteudo.documentMessage ?? conteudo.audioMessage;
  if (midia) {
    return { ...base, tipo: 'midia', corpo: textoDe((midia as { caption?: string }).caption),
      midia: `wa-media:${id}` };
  }
  return null;
}
