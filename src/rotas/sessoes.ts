import type { Rota } from '../http/roteador.ts';
import { inteiro, jid, objeto, texto, textoOpcional } from '../nucleo/validar.ts';
import * as svc from '../nucleo/servicos.ts';

const dadosDe = (c: unknown): Record<string, unknown> => objeto(c ?? {}, 'corpo');

export const rotasSessoes: Rota[] = [
  { metodo: 'GET', padrao: '/api/sessions', tratar: ({ banco }) => ({ itens: svc.listarSessoes(banco) }) },
  { metodo: 'POST', padrao: '/api/sessions', tratar: ({ banco, corpo }) => {
    const dados = dadosDe(corpo);
    return svc.criarSessao(banco, texto(dados.nome, 'nome', { max: 80 }),
      textoOpcional(dados.motor, 'motor', { max: 40 }) ?? 'simulado');
  } },
  { metodo: 'GET', padrao: '/api/sessions/:id', tratar: ({ banco, params }) => svc.obterSessao(banco, params.id as string) },
  { metodo: 'DELETE', padrao: '/api/sessions/:id', tratar: ({ banco, params, pastaDados }) =>
    svc.removerSessao(banco, params.id as string, pastaDados) },
  { metodo: 'POST', padrao: '/api/sessions/:id/start', tratar: async ({ banco, motor, params }) =>
    svc.iniciarSessao(banco, motor, params.id as string) },
  { metodo: 'POST', padrao: '/api/sessions/:id/stop', tratar: async ({ banco, motor, params }) =>
    svc.pararSessao(banco, motor, params.id as string) },
  { metodo: 'POST', padrao: '/api/sessions/:id/pair', tratar: async ({ banco, motor, params, corpo }) => {
    const dados = dadosDe(corpo);
    return svc.parearSessao(banco, motor, params.id as string, texto(dados.numero, 'numero', { max: 20 }));
  } },
  { metodo: 'GET', padrao: '/api/sessions/:id/status', tratar: ({ banco, params }) => svc.statusSessao(banco, params.id as string) },
  { metodo: 'GET', padrao: '/api/sessions/:id/qr', tratar: ({ banco, params }) => svc.qrDaSessao(banco, params.id as string) },
  { metodo: 'GET', padrao: '/api/sessions/:id/messages', tratar: ({ banco, params, query }) =>
    svc.listarMensagens(banco, params.id as string, inteiro(query.get('limite') ?? 50, 'limite', { min: 1, max: 200 }),
      textoOpcional(query.get('antes'), 'antes', { max: 40 })) },
  { metodo: 'POST', padrao: '/api/sessions/:id/messages/send-text', tratar: async ({ banco, motor, params, corpo }) => {
    const dados = dadosDe(corpo);
    return svc.enviarTexto(banco, motor, params.id as string, jid(dados.para),
      texto(dados.texto, 'texto', { max: 4096 }));
  } },
  { metodo: 'POST', padrao: '/api/sessions/:id/messages/send-media', tratar: async ({ banco, motor, params, corpo }) => {
    const dados = dadosDe(corpo);
    return svc.enviarMidia(banco, motor, params.id as string, jid(dados.para),
      texto(dados.midia, 'midia', { max: 2000 }), textoOpcional(dados.legenda, 'legenda', { max: 1024 }));
  } },
  { metodo: 'GET', padrao: '/api/sessions/:id/contacts', tratar: ({ banco, params }) => svc.listarContatos(banco, params.id as string) },
  { metodo: 'POST', padrao: '/api/sessions/:id/contacts', tratar: ({ banco, params, corpo }) => {
    const dados = dadosDe(corpo);
    return svc.criarContato(banco, params.id as string, jid(dados.jid), texto(dados.nome, 'nome', { max: 80 }));
  } },
  { metodo: 'GET', padrao: '/api/sessions/:id/labels', tratar: ({ banco, params }) => svc.listarEtiquetas(banco, params.id as string) },
  { metodo: 'GET', padrao: '/api/sessions/:id/groups', tratar: ({ banco, params }) => svc.listarGrupos(banco, params.id as string) },
];
