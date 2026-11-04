import type { Rota } from '../http/roteador.ts';
import { chaveValida, criarChave } from '../nucleo/chaves.ts';
import { invalido, naoEncontrado } from '../nucleo/erros.ts';
import { texto } from '../nucleo/validar.ts';
import { gravarConfiguracoes, lerConfiguracoes } from '../nucleo/servicos.ts';

export const rotasAuth: Rota[] = [
  { metodo: 'POST', padrao: '/api/auth/validate', tratar: ({ chaveApresentada, banco }) => {
    if (!chaveValida(banco, chaveApresentada)) throw invalido('chave inválida');
    return { valida: true };
  } },
  { metodo: 'GET', padrao: '/api/auth/api-keys', tratar: ({ banco }) => ({
    itens: banco.prepare('SELECT id, nome, criada_em, revogada_em FROM api_keys ORDER BY criada_em DESC').all(),
  }) },
  { metodo: 'POST', padrao: '/api/auth/api-keys', tratar: ({ banco, corpo }) => {
    const dados = (corpo ?? {}) as Record<string, unknown>;
    return criarChave(banco, texto(dados.nome, 'nome', { max: 80 }));
  } },
  { metodo: 'GET', padrao: '/api/auth/api-keys/:id', tratar: ({ banco, params }) => {
    const linha = banco.prepare('SELECT id, nome, criada_em, revogada_em FROM api_keys WHERE id = ?')
      .get(params.id as string);
    if (!linha) throw naoEncontrado('chave');
    return linha;
  } },
  { metodo: 'POST', padrao: '/api/auth/api-keys/:id/revoke', tratar: ({ banco, params }) => {
    const r = banco.prepare('UPDATE api_keys SET revogada_em = ? WHERE id = ? AND revogada_em IS NULL')
      .run(new Date().toISOString(), params.id as string);
    if (r.changes === 0) throw naoEncontrado('chave ativa');
    return { revogada: params.id };
  } },
  { metodo: 'DELETE', padrao: '/api/auth/api-keys/:id', tratar: ({ banco, params }) => {
    const r = banco.prepare('DELETE FROM api_keys WHERE id = ?').run(params.id as string);
    if (r.changes === 0) throw naoEncontrado('chave');
    return { removida: params.id };
  } },
  { metodo: 'GET', padrao: '/api/settings', tratar: ({ banco }) => lerConfiguracoes(banco) },
  { metodo: 'PUT', padrao: '/api/settings', tratar: ({ banco, corpo }) => {
    const dados = (corpo ?? {}) as Record<string, unknown>;
    if (typeof dados !== 'object' || Array.isArray(dados)) throw invalido('configuração deve ser objeto');
    return gravarConfiguracoes(banco, dados);
  } },
];
