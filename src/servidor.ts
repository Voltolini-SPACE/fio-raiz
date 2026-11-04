import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { abrirBanco } from './nucleo/banco.ts';
import { chaveValida, semearChave } from './nucleo/chaves.ts';
import { ErroHttp, naoAutorizado } from './nucleo/erros.ts';
import type { Motor } from './motor/porta.ts';
import type { ObservadorMotor } from './motor/baileys.ts';
import { criarMotor } from './motor/selecao.ts';
import * as svc from './nucleo/servicos.ts';
import { procurar, type Rota } from './http/roteador.ts';
import { rotas as rotasDaCasa } from './rotas/index.ts';
import { atenderMcp } from './mcp/servidor.ts';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PORTA = Number(process.env.PORT ?? 2790);
const PASTA_DADOS = process.env.FIO_RAIZ_DATA ?? resolve(AQUI, '..', 'data');
const LIMITE_CORPO = 1_000_000;

export type MotorOuFabrica = Motor | ((observador: ObservadorMotor) => Motor);

export function criarAplicacao(opcoes: { pastaDados?: string; motor?: MotorOuFabrica } = {}) {
  const pasta = opcoes.pastaDados ?? PASTA_DADOS;
  const banco = abrirBanco(pasta);
  const semente = semearChave(banco, pasta === ':memory:' ? resolve(AQUI, '..', 'data') : pasta);
  const observador: ObservadorMotor = {
    aoMudarEstado: (sessaoId, estado, qr) => svc.registrarEstado(banco, sessaoId, estado, qr),
    aoReceber: (sessaoId, mensagem) => svc.registrarEntrada(banco, sessaoId, mensagem),
  };
  const motor = typeof opcoes.motor === 'function'
    ? opcoes.motor(observador)
    : opcoes.motor ?? criarMotor({ pastaDados: pasta, observador });
  const rotas: Rota[] = [...rotasDaCasa,
    { metodo: 'POST', padrao: '/mcp', publica: true, tratar: (c) => atenderMcp(c) }];

  async function lerCorpo(req: IncomingMessage): Promise<unknown> {
    if (req.method === 'GET' || req.method === 'DELETE') return null;
    const partes: Buffer[] = [];
    let total = 0;
    for await (const parte of req) {
      total += (parte as Buffer).length;
      if (total > LIMITE_CORPO) throw new ErroHttp(413, 'corpo_grande', 'corpo passa de 1 MB');
      partes.push(parte as Buffer);
    }
    if (total === 0) return null;
    const bruto = Buffer.concat(partes).toString('utf8');
    try {
      return JSON.parse(bruto) as unknown;
    } catch {
      throw new ErroHttp(400, 'json_invalido', 'corpo não é JSON');
    }
  }

  function responder(res: ServerResponse, codigo: number, dados: unknown): void {
    const texto = JSON.stringify(dados ?? {});
    res.writeHead(codigo, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    res.end(texto);
  }

  const servidor = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const caminho = url.pathname.replace(/\/+$/, '') || '/';
    const metodo = (req.method ?? 'GET').toUpperCase() as Rota['metodo'];
    try {
      const encontrada = procurar(rotas, metodo, caminho);
      if (!encontrada) throw new ErroHttp(404, 'rota_desconhecida', `rota ${metodo} ${caminho} não existe`);
      const apresentada = req.headers['x-api-key'];
      const chaveApresentada = typeof apresentada === 'string' ? apresentada : undefined;
      if (!encontrada.rota.publica && !chaveValida(banco, chaveApresentada)) throw naoAutorizado();
      const corpo = await lerCorpo(req);
      const saida = await encontrada.rota.tratar({
        req, res, params: encontrada.params, query: url.searchParams, corpo, banco, motor,
        chaveApresentada,
      });
      if (res.headersSent) return;
      responder(res, 200, saida);
    } catch (erro) {
      if (erro instanceof ErroHttp) {
        responder(res, erro.codigo, { erro: erro.tipo, mensagem: erro.message });
        return;
      }
      const mensagem = erro instanceof Error ? erro.message : 'falha interna';
      responder(res, 500, { erro: 'falha_interna', mensagem });
    }
  });

  return { servidor, banco, motor, chave: semente.chave, pastaDados: pasta };
}

export function iniciar(porta = PORTA): ReturnType<typeof criarAplicacao> {
  const app = criarAplicacao();
  app.servidor.listen(porta, '127.0.0.1', () => {
    console.log(`Fio Raiz em http://127.0.0.1:${porta} · chave em ${app.pastaDados}/.api-key`);
  });
  return app;
}

const executadoDireto = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (executadoDireto) iniciar();
