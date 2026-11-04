/** Motor real: WhatsApp via Baileys, atrás da porta `Motor`.

A biblioteca é carregada por `import()` dinâmico e não entra em `dependencies`: sem ela, o
produto continua funcionando no motor simulado e este módulo responde com instrução clara.
*/
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { EstadoSessao, Motor } from './porta.ts';
import { traduzirAtualizacao, traduzirMensagem, type MensagemEntrada } from './eventos.ts';

export interface ObservadorMotor {
  aoMudarEstado(sessaoId: string, estado: EstadoSessao, qr: string | null): void;
  aoReceber(sessaoId: string, mensagem: MensagemEntrada): void;
}

export interface SocketLike {
  ev: { on(evento: string, ouvinte: (dado: unknown) => void): void };
  sendMessage(jid: string, conteudo: Record<string, unknown>): Promise<{ key?: { id?: string } } | undefined | void>;
  requestPairingCode?(numero: string): Promise<string>;
  logout?(): Promise<void>;
  end?(erro?: Error): void;
}

export interface OpcoesFabricaSocket {
  sessaoId: string;
  pastaAuth: string;
}

export type FabricaSocket = (opcoes: OpcoesFabricaSocket) => Promise<SocketLike>;

export interface OpcoesMotorBaileys {
  pastaDados: string;
  observador: ObservadorMotor;
  fabrica?: FabricaSocket;
  agendar?: (fn: () => void, ms: number) => unknown;
  esperaInicioMs?: number;
  maxTentativas?: number;
}

export class MotorIndisponivel extends Error {
  readonly codigo = 'motor_indisponivel';
  constructor() {
    super('motor real exige a biblioteca: npm i baileys@7.0.0-rc14');
  }
}

const silencioso = {
  level: 'silent',
  child() { return silencioso; },
  trace() {}, debug() {}, info() {}, warn() {}, error() {}, fatal() {},
};

/** Forma mínima que usamos da biblioteca: o tipo real não entra no build do núcleo. */
interface ModuloTransporte {
  useMultiFileAuthState(pasta: string): Promise<{ state: unknown; saveCreds: () => Promise<void> }>;
  makeWASocket(config: Record<string, unknown>): SocketLike;
}

const fabricaPadrao: FabricaSocket = async ({ pastaAuth }) => {
  const especificador = 'baileys';
  let baileys: ModuloTransporte;
  try {
    baileys = (await import(especificador)) as ModuloTransporte;
  } catch {
    throw new MotorIndisponivel();
  }
  mkdirSync(pastaAuth, { recursive: true, mode: 0o700 });
  const { state, saveCreds } = await baileys.useMultiFileAuthState(pastaAuth);
  const sock = baileys.makeWASocket({
    auth: state, printQRInTerminal: false, syncFullHistory: false,
    markOnlineOnConnect: false, logger: silencioso,
  });
  sock.ev.on('creds.update', saveCreds);
  return sock;
};

interface SessaoInterna {
  estado: EstadoSessao;
  qr: string | null;
  tentativas: number;
  sock?: SocketLike;
  inicio?: () => void;
  timer?: ReturnType<typeof setTimeout>;
}

export class MotorBaileys implements Motor {
  readonly nome = 'baileys';
  private readonly sessoes = new Map<string, SessaoInterna>();
  private readonly pastaDados: string;
  private readonly observador: ObservadorMotor;
  private readonly fabrica: FabricaSocket;
  private readonly agendar: (fn: () => void, ms: number) => unknown;
  private readonly esperaInicio: number;
  private readonly maxTentativas: number;

  constructor(opcoes: OpcoesMotorBaileys) {
    this.pastaDados = opcoes.pastaDados;
    this.observador = opcoes.observador;
    this.fabrica = opcoes.fabrica ?? fabricaPadrao;
    this.agendar = opcoes.agendar ?? ((fn, ms) => setTimeout(fn, ms));
    this.esperaInicio = opcoes.esperaInicioMs ?? 20_000;
    this.maxTentativas = opcoes.maxTentativas ?? 5;
  }

  estado(sessaoId: string): EstadoSessao {
    return this.sessoes.get(sessaoId)?.estado ?? 'criada';
  }

  private sessao(sessaoId: string): SessaoInterna {
    const existente = this.sessoes.get(sessaoId);
    if (existente) return existente;
    const nova: SessaoInterna = { estado: 'criada', qr: null, tentativas: 0 };
    this.sessoes.set(sessaoId, nova);
    return nova;
  }

  private mudar(sessaoId: string, sessao: SessaoInterna, estado: EstadoSessao, qr: string | null): void {
    sessao.estado = estado;
    sessao.qr = qr;
    this.observador.aoMudarEstado(sessaoId, estado, qr);
    if (estado !== 'iniciando') {
      sessao.inicio?.();
      sessao.inicio = undefined;
    }
  }

  async iniciar(sessaoId: string): Promise<{ estado: EstadoSessao; qr?: string }> {
    const sessao = this.sessao(sessaoId);
    if (!sessao.sock) return this.abrir(sessaoId, sessao);
    return { estado: sessao.estado, qr: sessao.qr ?? undefined };
  }

  private async abrir(sessaoId: string, sessao: SessaoInterna): Promise<{ estado: EstadoSessao; qr?: string }> {
    sessao.estado = 'iniciando';
    this.observador.aoMudarEstado(sessaoId, 'iniciando', null);
    const primeiro = new Promise<void>((resolver) => { sessao.inicio = resolver; });
    const pastaAuth = join(this.pastaDados, 'sessoes', sessaoId, 'auth');
    const sock = await this.fabrica({ sessaoId, pastaAuth });
    sock.ev.on('connection.update', (update) => this.atualizar(sessaoId, sessao, update));
    sock.ev.on('messages.upsert', (dados) => {
      for (const mensagem of (dados as { messages?: unknown[] })?.messages ?? []) {
        const traduzida = traduzirMensagem(mensagem);
        if (traduzida) this.observador.aoReceber(sessaoId, traduzida);
      }
    });
    sessao.sock = sock;
    const espera = new Promise<void>((resolver) => {
      sessao.timer = setTimeout(resolver, this.esperaInicio);
    });
    await Promise.race([primeiro, espera]);
    if (sessao.timer) clearTimeout(sessao.timer);
    return { estado: sessao.estado, qr: sessao.qr ?? undefined };
  }

  private atualizar(sessaoId: string, sessao: SessaoInterna, update: unknown): void {
    const traduzida = traduzirAtualizacao(update);
    if (traduzida.qr) { this.mudar(sessaoId, sessao, 'aguardando_qr', traduzida.qr); return; }
    if (traduzida.estado === 'conectada') sessao.tentativas = 0;
    if (traduzida.estado) this.mudar(sessaoId, sessao, traduzida.estado, null);
    if (traduzida.reconectar) this.reconectar(sessaoId, sessao);
  }

  private reconectar(sessaoId: string, sessao: SessaoInterna): void {
    sessao.sock = undefined;
    sessao.tentativas += 1;
    if (sessao.tentativas > this.maxTentativas) {
      this.mudar(sessaoId, sessao, 'erro', null);
      return;
    }
    const ms = Math.min(30_000, 1000 * 2 ** (sessao.tentativas - 1));
    this.agendar(() => { void this.iniciar(sessaoId).catch(() => undefined); }, ms);
  }

  async parar(sessaoId: string): Promise<EstadoSessao> {
    const sessao = this.sessao(sessaoId);
    if (sessao.timer) clearTimeout(sessao.timer);
    try {
      if (sessao.sock?.logout) await sessao.sock.logout();
      else sessao.sock?.end?.();
    } catch { /* já encerrado */ }
    sessao.sock = undefined;
    sessao.tentativas = 0;
    this.mudar(sessaoId, sessao, 'parada', null);
    return 'parada';
  }

  async parear(sessaoId: string, numero: string): Promise<{ codigo: string } | null> {
    const sessao = this.sessao(sessaoId);
    if (!sessao.sock?.requestPairingCode) return null;
    const codigo = await sessao.sock.requestPairingCode(numero);
    return { codigo };
  }

  private exigirConectada(sessaoId: string): SocketLike {
    const sessao = this.sessoes.get(sessaoId);
    if (!sessao || sessao.estado !== 'conectada' || !sessao.sock) {
      throw new Error('sessão não conectada');
    }
    return sessao.sock;
  }

  async enviarTexto(sessaoId: string, conversa: string, corpo: string): Promise<{ id: string }> {
    const sock = this.exigirConectada(sessaoId);
    const r = await sock.sendMessage(conversa, { text: corpo });
    return { id: (r as { key?: { id?: string } } | undefined)?.key?.id ?? `wa_${randomUUID()}` };
  }

  async enviarMidia(sessaoId: string, conversa: string, midia: string, legenda?: string): Promise<{ id: string }> {
    const sock = this.exigirConectada(sessaoId);
    const { bytes, mimetype } = await this.baixar(midia);
    const conteudo: Record<string, unknown> = mimetype.startsWith('image/')
      ? { image: bytes }
      : mimetype.startsWith('video/')
        ? { video: bytes }
        : mimetype.startsWith('audio/')
          ? { audio: bytes, mimetype }
          : { document: bytes, mimetype, fileName: 'arquivo' };
    if (legenda && !mimetype.startsWith('audio/')) conteudo.caption = legenda;
    const r = await sock.sendMessage(conversa, conteudo);
    return { id: (r as { key?: { id?: string } } | undefined)?.key?.id ?? `wa_${randomUUID()}` };
  }

  private async baixar(midia: string): Promise<{ bytes: Buffer; mimetype: string }> {
    const dados = /^data:([^;]+);base64,(.*)$/.exec(midia);
    if (dados) return { bytes: Buffer.from(dados[2] as string, 'base64'), mimetype: dados[1] as string };
    if (!/^https?:\/\//.test(midia)) throw new Error('mídia deve ser URL http(s) ou data:');
    const resposta = await fetch(midia, { signal: AbortSignal.timeout(15_000) });
    if (!resposta.ok) throw new Error(`mídia respondeu ${resposta.status}`);
    return {
      bytes: Buffer.from(await resposta.arrayBuffer()),
      mimetype: resposta.headers.get('content-type') ?? 'application/octet-stream',
    };
  }
}

export function criarMotorBaileys(opcoes: OpcoesMotorBaileys): MotorBaileys {
  return new MotorBaileys(opcoes);
}
