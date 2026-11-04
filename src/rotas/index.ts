import type { Rota } from '../http/roteador.ts';
import { rotasAuth } from './auth.ts';
import { rotasMeta } from './meta.ts';
import { rotasSaude } from './saude.ts';
import { rotasSessoes } from './sessoes.ts';
import { rotasPainel } from './painel.ts';

export const rotas: Rota[] = [...rotasSaude, ...rotasAuth, ...rotasSessoes, ...rotasMeta, ...rotasPainel];
