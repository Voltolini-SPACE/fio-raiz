import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { criarMotorBaileys, type FabricaSocket } from '../src/motor/baileys.ts';
import { subir } from './ajuda.ts';

type Ouvinte = (dado: unknown) => void;

function cenario() {
  const sockets: Array<{
    ev: { on: (evento: string, ouvinte: Ouvinte) => void };
    ouvintes: Map<string, Ouvinte[]>;
    enviados: Array<{ jid: string; conteudo: Record<string, unknown> }>;
    sendMessage: (jid: string, conteudo: Record<string, unknown>) => Promise<{ key: { id: string } }>;
    emitir: (evento: string, dado: unknown) => void;
  }> = [];
  const fabrica: FabricaSocket = async () => {
    const ouvintes = new Map<string, Ouvinte[]>();
    const s = {
      ouvintes, enviados: [] as Array<{ jid: string; conteudo: Record<string, unknown> }>,
      ev: { on: (evento: string, ouvinte: Ouvinte) => {
        ouvintes.set(evento, [...(ouvintes.get(evento) ?? []), ouvinte]);
      } },
      sendMessage: async (jid: string, conteudo: Record<string, unknown>) => {
        s.enviados.push({ jid, conteudo });
        return { key: { id: 'WA-ID-9' } };
      },
      requestPairingCode: async () => 'ABCD-1234',
      emitir: (evento: string, dado: unknown) => { for (const o of ouvintes.get(evento) ?? []) o(dado); },
    };
    sockets.push(s);
    setTimeout(() => s.emitir('connection.update', { qr: '2@QR-HTTP' }), 0);
    return s;
  };
  return { sockets, fabrica };
}

test('sessão real grava QR, recebe mensagem e envia pelo WhatsApp', async () => {
  const pasta = mkdtempSync(join(tmpdir(), 'fio-raiz-real-'));
  const c = cenario();
  const app = await subir({ pasta, motor: (observador) => criarMotorBaileys({
    pastaDados: pasta, observador, fabrica: c.fabrica, esperaInicioMs: 500,
  }) });
  try {
    const criada = await (await app.pedir('/api/sessions', { metodo: 'POST', corpo: { nome: 'Real', motor: 'baileys' } })).json() as { id: string };
    const iniciada = await (await app.pedir(`/api/sessions/${criada.id}/start`, { metodo: 'POST' })).json() as { estado: string };
    assert.equal(iniciada.estado, 'aguardando_qr');
    const qr = await (await app.pedir(`/api/sessions/${criada.id}/qr`)).json() as { qr: string };
    assert.equal(qr.qr, '2@QR-HTTP');

    c.sockets[0]!.emitir('connection.update', { connection: 'open' });
    c.sockets[0]!.emitir('messages.upsert', { messages: [{
      key: { remoteJid: '5511999999999@s.whatsapp.net', fromMe: false, id: 'A1' },
      message: { conversation: 'primeira mensagem' }, messageTimestamp: 1700000000,
    }] });
    await new Promise((r) => setTimeout(r, 20));
    const mensagens = await (await app.pedir(`/api/sessions/${criada.id}/messages`)).json() as { itens: Array<{ direcao: string; corpo: string }> };
    assert.equal(mensagens.itens[0]?.direcao, 'entrada');
    assert.equal(mensagens.itens[0]?.corpo, 'primeira mensagem');

    const enviada = await (await app.pedir(`/api/sessions/${criada.id}/messages/send-text`, {
      metodo: 'POST', corpo: { para: '5511888888888', texto: 'respondendo' },
    })).json() as { id: string; estado: string };
    assert.equal(enviada.estado, 'enviada');
    assert.deepEqual(c.sockets[0]!.enviados[0], { jid: '5511888888888@s.whatsapp.net', conteudo: { text: 'respondendo' } });
    assert.match(enviada.id, /^msg_/);

    const pareada = await (await app.pedir(`/api/sessions/${criada.id}/pair`, {
      metodo: 'POST', corpo: { numero: '5511977776666' },
    })).json() as { estado: string; codigo: string };
    assert.equal(pareada.estado, 'aguardando_qr');
    assert.equal(pareada.codigo, 'ABCD-1234');
  } finally {
    await app.fechar();
    rmSync(pasta, { recursive: true, force: true });
  }
});
