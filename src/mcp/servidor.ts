import type { Contexto } from '../http/roteador.ts';
import { chaveValida } from '../nucleo/chaves.ts';
import { ErroHttp, naoAutorizado } from '../nucleo/erros.ts';
import * as svc from '../nucleo/servicos.ts';
import { inteiro, jid, texto } from '../nucleo/validar.ts';

export const PROTOCOLO = '2025-06-18';
export const VERSAO = '0.1.0';

interface Pedido { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> }

type Ferramenta = {
  name: string; description: string;
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
  executar: (c: Contexto, args: Record<string, unknown>) => unknown;
};

const FERRAMENTAS: Ferramenta[] = [
  { name: 'HealthGet', description: 'Estado do gateway e do banco.', inputSchema: { type: 'object', properties: {} },
    executar: ({ banco }) => ({ estado: 'ok', banco: banco.prepare('SELECT 1 ok').get() }) },
  { name: 'SessionFindAll', description: 'Lista sessões de WhatsApp.', inputSchema: { type: 'object', properties: {} },
    executar: ({ banco }) => ({ itens: svc.listarSessoes(banco) }) },
  { name: 'SessionGetStats', description: 'Totais de mensagens por dia.', inputSchema: {
      type: 'object', properties: { sessionId: { type: 'string' } } },
    executar: ({ banco }, args) => svc.estatisticasMensagens(banco,
      typeof args.sessionId === 'string' ? args.sessionId : undefined) },
  { name: 'MessageFindAll', description: 'Lista mensagens de uma sessão.', inputSchema: {
      type: 'object', properties: { sessionId: { type: 'string' }, limit: { type: 'number' } },
      required: ['sessionId'] },
    executar: ({ banco }, args) => svc.listarMensagens(banco, texto(args.sessionId, 'sessionId'),
      inteiro(args.limit ?? 50, 'limit', { min: 1, max: 200 })) },
  { name: 'MessageSendText', description: 'Envia texto por uma sessão conectada.', inputSchema: {
      type: 'object', properties: { sessionId: { type: 'string' }, to: { type: 'string' }, text: { type: 'string' } },
      required: ['sessionId', 'to', 'text'] },
    executar: ({ banco, motor }, args) => svc.enviarTexto(banco, motor, texto(args.sessionId, 'sessionId'),
      jid(args.to, 'to'), texto(args.text, 'text')) },
  { name: 'WebhooksList', description: 'Lista webhooks assinados.', inputSchema: { type: 'object', properties: {} },
    executar: ({ banco }) => svc.listarWebhooks(banco) },
  { name: 'ContactFindAll', description: 'Lista contatos de uma sessão.', inputSchema: {
      type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] },
    executar: ({ banco }, args) => svc.listarContatos(banco, texto(args.sessionId, 'sessionId')) },
  { name: 'LabelFindAll', description: 'Lista etiquetas de uma sessão.', inputSchema: {
      type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] },
    executar: ({ banco }, args) => svc.listarEtiquetas(banco, texto(args.sessionId, 'sessionId')) },
  { name: 'GroupFindAll', description: 'Lista grupos de uma sessão.', inputSchema: {
      type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] },
    executar: ({ banco }, args) => svc.listarGrupos(banco, texto(args.sessionId, 'sessionId')) },
  { name: 'SettingsGet', description: 'Configurações do gateway.', inputSchema: { type: 'object', properties: {} },
    executar: ({ banco }) => svc.lerConfiguracoes(banco) },
];

const LISTA = FERRAMENTAS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));

export function atenderMcp(c: Contexto): unknown {
  if (!chaveValida(c.banco, c.chaveApresentada)) throw naoAutorizado('chave de API do MCP ausente ou inválida');
  const pedido = (c.corpo ?? {}) as Pedido;
  if (typeof pedido.method !== 'string') throw new ErroHttp(400, 'jsonrpc_invalido', 'method ausente');
  const base = { jsonrpc: '2.0', id: pedido.id ?? null };
  try {
    const resultado = despachar(c, pedido.method, pedido.params ?? {});
    return { ...base, result: resultado };
  } catch (erro) {
    if (erro instanceof ErroHttp) {
      return { ...base, error: { code: -32602, message: `${erro.tipo}: ${erro.message}` } };
    }
    const mensagem = erro instanceof Error ? erro.message : 'falha';
    return { ...base, error: { code: -32603, message: mensagem.slice(0, 200) } };
  }
}

function despachar(c: Contexto, metodo: string, params: Record<string, unknown>): unknown {
  if (metodo === 'initialize') {
    return {
      protocolVersion: PROTOCOLO,
      serverInfo: { name: 'fio-raiz', version: VERSAO },
      capabilities: { tools: { listChanged: false } },
    };
  }
  if (metodo === 'ping') return {};
  if (metodo === 'tools/list') return { tools: LISTA };
  if (metodo === 'tools/call') {
    const nome = texto(params.name, 'name', { max: 60 });
    const ferramenta = FERRAMENTAS.find((f) => f.name === nome);
    if (!ferramenta) throw new ErroHttp(404, 'ferramenta_desconhecida', nome);
    const args = (params.arguments ?? {}) as Record<string, unknown>;
    const saida = ferramenta.executar(c, args);
    return { content: [{ type: 'text', text: JSON.stringify(saida) }], isError: false };
  }
  throw new ErroHttp(400, 'metodo_desconhecido', metodo);
}
