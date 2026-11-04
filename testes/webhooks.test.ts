import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { createHmac } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { subir, type Aplicacao } from './ajuda.ts';

let app: Aplicacao;
let receptor: Server;
let recebidos: Array<{ evento: string; assinatura: string; corpo: string }> = [];
let endereco = '';

before(async () => {
  app = await subir();
  receptor = createServer((req, res) => {
    let corpo = '';
    req.on('data', (p) => { corpo += p; });
    req.on('end', () => {
      recebidos.push({
        evento: (JSON.parse(corpo) as { evento: string }).evento,
        assinatura: String(req.headers['x-fio-assinatura']),
        corpo,
      });
      res.writeHead(200).end('ok');
    });
  });
  await new Promise<void>((ok) => receptor.listen(0, '127.0.0.1', ok));
  endereco = `http://127.0.0.1:${(receptor.address() as AddressInfo).port}/gancho`;
});

after(async () => {
  await app.fechar();
  await new Promise<void>((ok) => receptor.close(() => ok()));
});

test('url inválida e evento vazio são recusados', async () => {
  assert.equal((await app.pedir('/api/webhooks', { metodo: 'POST', corpo: { url: 'ftp://x', eventos: ['message.enviada'] } })).status, 400);
  assert.equal((await app.pedir('/api/webhooks', { metodo: 'POST', corpo: { url: endereco, eventos: [] } })).status, 400);
});

test('webhook recebe evento de mensagem enviada', async () => {
  recebidos = [];
  const criado = await app.pedir('/api/webhooks', { metodo: 'POST', corpo: { url: endereco, eventos: ['message.enviada'] } });
  assert.equal(criado.status, 200);
  const { id, segredo } = await criado.json() as { id: string; segredo: string };
  assert.match(segredo, /^whsec_[0-9a-f]{32}$/);
  const sessao = await (await app.pedir('/api/sessions', { metodo: 'POST', corpo: { nome: 'Gancho' } })).json() as { id: string };
  await app.pedir(`/api/sessions/${sessao.id}/start`, { metodo: 'POST' });
  await app.pedir(`/api/sessions/${sessao.id}/messages/send-text`, { metodo: 'POST', corpo: { para: '5511999998888', texto: 'oi' } });
  assert.equal(recebidos.length, 1);
  assert.equal(recebidos[0]?.evento, 'message.enviada');
  assert.equal(recebidos[0]?.assinatura,
    `sha256=${createHmac('sha256', segredo).update(recebidos[0]?.corpo ?? '').digest('hex')}`);
  const falhas = await (await app.pedir('/api/webhooks/delivery-failures')).json() as { itens: unknown[] };
  assert.equal(falhas.itens.length, 0);
  assert.equal((await app.pedir(`/api/webhooks/${id}`, { metodo: 'DELETE' })).status, 200);
});
