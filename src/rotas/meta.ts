import type { Rota } from '../http/roteador.ts';
import { invalido } from '../nucleo/erros.ts';
import { texto, textoOpcional } from '../nucleo/validar.ts';
import * as svc from '../nucleo/servicos.ts';

export const rotasMeta: Rota[] = [
  { metodo: 'GET', padrao: '/api/webhooks', tratar: ({ banco }) => svc.listarWebhooks(banco) },
  { metodo: 'POST', padrao: '/api/webhooks', tratar: ({ banco, corpo }) => {
    const dados = (corpo ?? {}) as Record<string, unknown>;
    const eventos = Array.isArray(dados.eventos) ? dados.eventos.map((e) => texto(e, 'evento', { max: 60 })) : [];
    return svc.criarWebhook(banco, texto(dados.url, 'url', { max: 2000 }), eventos,
      textoOpcional(dados.sessao_id, 'sessao_id', { max: 60 }));
  } },
  { metodo: 'DELETE', padrao: '/api/webhooks/:id', tratar: ({ banco, params }) => svc.removerWebhook(banco, params.id as string) },
  { metodo: 'GET', padrao: '/api/webhooks/delivery-failures', tratar: ({ banco }) => svc.falhasDeEntrega(banco) },
  { metodo: 'GET', padrao: '/api/search', tratar: ({ banco, query }) => {
    const termo = textoOpcional(query.get('q'), 'q', { max: 200 });
    if (!termo || termo.length < 2) throw invalido('q precisa de ao menos 2 caracteres');
    return svc.buscar(banco, termo);
  } },
  { metodo: 'GET', padrao: '/api/stats/overview', tratar: ({ banco }) => svc.visaoGeral(banco) },
  { metodo: 'GET', padrao: '/api/stats/messages', tratar: ({ banco, query }) =>
    svc.estatisticasMensagens(banco, textoOpcional(query.get('sessao_id'), 'sessao_id', { max: 60 })) },
];
