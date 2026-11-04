import { test } from 'node:test';
import assert from 'node:assert/strict';
import { traduzirAtualizacao, traduzirMensagem } from '../src/motor/eventos.ts';

test('qr abre a espera de leitura sem reconectar', () => {
  assert.deepEqual(traduzirAtualizacao({ qr: '2@abc' }), { estado: 'aguardando_qr', qr: '2@abc' });
});

test('conexão aberta vira conectada e limpa o qr', () => {
  assert.deepEqual(traduzirAtualizacao({ connection: 'open' }), { estado: 'conectada', qr: null });
});

test('401 não reconecta: sessão deslogada', () => {
  const r = traduzirAtualizacao({ connection: 'close', lastDisconnect: { error: { output: { statusCode: 401 } } } });
  assert.equal(r.estado, 'erro');
  assert.equal(r.reconectar, false);
});

test('queda comum pede reconexão', () => {
  const r = traduzirAtualizacao({ connection: 'close', lastDisconnect: { error: { output: { statusCode: 500 } } } });
  assert.equal(r.reconectar, true);
  assert.equal(r.estado, 'iniciando');
});

test('mensagem de texto vira entrada de domínio', () => {
  const r = traduzirMensagem({
    key: { remoteJid: '5511999999999@s.whatsapp.net', fromMe: false, id: 'A1' },
    message: { conversation: 'oi' }, messageTimestamp: 1700000000,
  });
  assert.deepEqual(r, { id: 'A1', conversa: '5511999999999@s.whatsapp.net', tipo: 'texto',
    corpo: 'oi', midia: null, recebida_em: 1700000000000 });
});

test('texto estendido e grupo', () => {
  const r = traduzirMensagem({
    key: { remoteJid: '1203630@g.us', fromMe: false, id: 'A2' },
    message: { extendedTextMessage: { text: 'bom dia' } },
  });
  assert.equal(r?.corpo, 'bom dia');
  assert.equal(r?.conversa, '1203630@g.us');
});

test('imagem recebida fica marcada como mídia do WhatsApp', () => {
  const r = traduzirMensagem({
    key: { remoteJid: '5511@s.whatsapp.net', fromMe: false, id: 'A3' },
    message: { imageMessage: { caption: 'foto', mimetype: 'image/jpeg' } },
  });
  assert.equal(r?.tipo, 'midia');
  assert.equal(r?.corpo, 'foto');
  assert.equal(r?.midia, 'wa-media:A3');
});

test('mensagem própria e sem conteúdo são ignoradas', () => {
  assert.equal(traduzirMensagem({ key: { remoteJid: '5511@s.whatsapp.net', fromMe: true, id: 'A4' },
    message: { conversation: 'eu' } }), null);
  assert.equal(traduzirMensagem({ key: { remoteJid: '5511@s.whatsapp.net', fromMe: false, id: 'A5' } }), null);
});

test('timestamp em formato Long do protobuf vira milissegundos', () => {
  const r = traduzirMensagem({
    key: { remoteJid: '5511@s.whatsapp.net', fromMe: false, id: 'A6' },
    message: { conversation: 'x' }, messageTimestamp: { low: 1700000000, high: 0, unsigned: false },
  });
  assert.equal(r?.recebida_em, 1700000000000);
});
