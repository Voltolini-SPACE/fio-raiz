import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarMotorBaileys, type FabricaSocket, type ObservadorMotor } from '../src/motor/baileys.ts';


type Ouvinte = (dado: unknown) => void;

class SocketFalso {
  readonly ouvintes = new Map<string, Ouvinte[]>();
  readonly enviados: Array<{ jid: string; conteudo: Record<string, unknown> }> = [];
  encerrado = false;
  ev = { on: (evento: string, ouvinte: Ouvinte) => {
    this.ouvintes.set(evento, [...(this.ouvintes.get(evento) ?? []), ouvinte]);
  } };
  emitir(evento: string, dado: unknown) { for (const o of this.ouvintes.get(evento) ?? []) o(dado); }
  async requestPairingCode() { return 'ABCD-1234'; }
  async sendMessage(jid: string, conteudo: Record<string, unknown>) {
    this.enviados.push({ jid, conteudo });
    return { key: { id: 'WA-ID-1' } };
  }
  end() { this.encerrado = true; }
}

function cenario() {
  const sockets: SocketFalso[] = [];
  const eventos: Array<{ estado: string; qr: string | null }> = [];
  const recebidas: string[] = [];
  const agendados: Array<{ fn: () => void; ms: number }> = [];
  const observador: ObservadorMotor = {
    aoMudarEstado: (_id, estado, qr) => eventos.push({ estado, qr }),
    aoReceber: (_id, m) => recebidas.push(m.id),
  };
  const fabrica: FabricaSocket = async (o) => {
    const s = new SocketFalso();
    sockets.push(s);
    setTimeout(() => s.emitir('connection.update', { qr: '2@QR-DE-TESTE' }), 0);
    return s;
  };
  const motor = criarMotorBaileys({
    pastaDados: '/tmp/fio-raiz-teste', observador, fabrica,
    agendar: (fn, ms) => { agendados.push({ fn, ms }); return 0; },
    esperaInicioMs: 200,
  });
  return { motor, sockets, eventos, recebidas, agendados, observador };
}

test('iniciar espera o primeiro evento e devolve o qr', async () => {
  const c = cenario();
  const r = await c.motor.iniciar('s1');
  assert.equal(r.estado, 'aguardando_qr');
  assert.equal(r.qr, '2@QR-DE-TESTE');
  assert.equal(c.eventos.at(-1)?.estado, 'aguardando_qr');
});

test('connecting não encerra a espera: só QR ou conexão contam', async () => {
  const sockets: SocketFalso[] = [];
  const fabrica: FabricaSocket = async () => {
    const s = new SocketFalso();
    sockets.push(s);
    setTimeout(() => s.emitir('connection.update', { connection: 'connecting' }), 0);
    setTimeout(() => s.emitir('connection.update', { qr: '2@DEPOIS' }), 30);
    return s;
  };
  const motor = criarMotorBaileys({
    pastaDados: '/tmp/fio-raiz-teste',
    observador: { aoMudarEstado: () => undefined, aoReceber: () => undefined },
    fabrica, esperaInicioMs: 500,
  });
  const r = await motor.iniciar('s2');
  assert.equal(r.estado, 'aguardando_qr');
  assert.equal(r.qr, '2@DEPOIS');
});

test('conexão aberta habilita envio e o id vem do WhatsApp', async () => {
  const c = cenario();
  await c.motor.iniciar('s1');
  c.sockets[0]!.emitir('connection.update', { connection: 'open' });
  const r = await c.motor.enviarTexto('s1', '5511999999999@s.whatsapp.net', 'oi');
  assert.equal(r.id, 'WA-ID-1');
  assert.deepEqual(c.sockets[0]!.enviados[0], { jid: '5511999999999@s.whatsapp.net', conteudo: { text: 'oi' } });
});

test('envio sem conexão falha', async () => {
  const c = cenario();
  await c.motor.iniciar('s1');
  await assert.rejects(() => c.motor.enviarTexto('s1', '5511@s.whatsapp.net', 'oi'), /não conectada/);
});

test('mensagem recebida chega ao observador', async () => {
  const c = cenario();
  await c.motor.iniciar('s1');
  c.sockets[0]!.emitir('messages.upsert', { type: 'notify', messages: [{
    key: { remoteJid: '5511@s.whatsapp.net', fromMe: false, id: 'A9' }, message: { conversation: 'oi' } }] });
  assert.deepEqual(c.recebidas, ['A9']);
});

test('queda reagenda reconexão com espera crescente', async () => {
  const c = cenario();
  await c.motor.iniciar('s1');
  c.sockets[0]!.emitir('connection.update', { connection: 'close', lastDisconnect: { error: { output: { statusCode: 500 } } } });
  assert.equal(c.agendados.length, 1);
  assert.equal(c.agendados[0]!.ms, 1000);
  c.agendados[0]!.fn();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(c.sockets.length, 2);
});

test('pareamento por código pede o código ao transporte', async () => {
  const c = cenario();
  await c.motor.iniciar('s1');
  assert.deepEqual(await c.motor.parear('s1', '5511977776666'), { codigo: 'ABCD-1234' });
});

test('parar encerra o socket', async () => {
  const c = cenario();
  await c.motor.iniciar('s1');
  assert.equal(await c.motor.parar('s1'), 'parada');
  assert.equal(c.sockets[0]!.encerrado, true);
});

test('mídia em data: vira imagem com legenda', async () => {
  const c = cenario();
  await c.motor.iniciar('s1');
  c.sockets[0]!.emitir('connection.update', { connection: 'open' });
  await c.motor.enviarMidia('s1', '5511@s.whatsapp.net', 'data:image/png;base64,iVBORw0KGgo=', 'olha');
  const conteudo = c.sockets[0]!.enviados[0]!.conteudo as Record<string, unknown>;
  assert.ok(Buffer.isBuffer(conteudo.image));
  assert.equal(conteudo.caption, 'olha');
});
