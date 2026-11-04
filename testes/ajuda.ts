import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { criarAplicacao, type MotorOuFabrica } from '../src/servidor.ts';

export interface Aplicacao {
  url: string;
  chave: string;
  pasta: string;
  pedir: (rota: string, opcoes?: { metodo?: string; corpo?: unknown; chave?: string | null }) => Promise<Response>;
  fechar: () => Promise<void>;
}

export async function subir(opcoes: { pasta?: string; motor?: MotorOuFabrica } = {}): Promise<Aplicacao> {
  const pasta = opcoes.pasta ?? mkdtempSync(join(tmpdir(), 'fio-raiz-teste-'));
  const app = criarAplicacao({ pastaDados: pasta, motor: opcoes.motor });
  await new Promise<void>((ok) => app.servidor.listen(0, '127.0.0.1', ok));
  const { port } = app.servidor.address() as AddressInfo;
  const url = `http://127.0.0.1:${port}`;
  return {
    url,
    chave: app.chave,
    pasta,
    pedir: (rota, opcoes = {}) => {
      const cabecalhos: Record<string, string> = { 'content-type': 'application/json' };
      const chave = opcoes.chave === undefined ? app.chave : opcoes.chave;
      if (chave) cabecalhos['x-api-key'] = chave;
      return fetch(url + rota, {
        method: opcoes.metodo ?? 'GET',
        headers: cabecalhos,
        body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
      });
    },
    fechar: async () => {
      app.servidor.closeAllConnections();
      await new Promise<void>((ok) => app.servidor.close(() => ok()));
      app.banco.close();
      rmSync(pasta, { recursive: true, force: true });
    },
  };
}
