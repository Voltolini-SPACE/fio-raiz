/** Erro que vira resposta HTTP com código e mensagem curta. */
export class ErroHttp extends Error {
  readonly codigo: number;
  readonly tipo: string;

  constructor(codigo: number, tipo: string, mensagem: string) {
    super(mensagem);
    this.codigo = codigo;
    this.tipo = tipo;
  }
}

export const naoEncontrado = (o: string) => new ErroHttp(404, 'nao_encontrado', `${o} não encontrado`);
export const invalido = (o: string) => new ErroHttp(400, 'pedido_invalido', o);
export const naoAutorizado = (o = 'chave de API ausente ou inválida') =>
  new ErroHttp(401, 'nao_autorizado', o);
export const conflito = (o: string) => new ErroHttp(409, 'conflito', o);
