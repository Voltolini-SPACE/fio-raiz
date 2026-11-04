import type { Rota } from '../http/roteador.ts';
import { agora } from '../nucleo/banco.ts';

const inicio = Date.now();

export const rotasSaude: Rota[] = [
  { metodo: 'GET', padrao: '/api/health', publica: true, tratar: () => ({
    estado: 'ok', servico: 'fio-raiz', versao: '0.1.0', uptime_s: Math.round((Date.now() - inicio) / 1000), em: agora(),
  }) },
  { metodo: 'GET', padrao: '/api/health/live', publica: true, tratar: () => ({ vivo: true }) },
  { metodo: 'GET', padrao: '/api/health/ready', publica: true, tratar: ({ banco }) => {
    banco.prepare('SELECT 1').get();
    return { pronto: true, banco: 'ok' };
  } },
];
