import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enderecoPermitido } from '../src/servidor.ts';

test('loopback e tailnet passam; LAN, internet e vazio não', () => {
  for (const ok of ['127.0.0.1', '::1', '::ffff:127.0.0.1', '100.105.131.93', '100.64.0.2', '::ffff:100.84.63.59', '100.120.1.5']) {
    assert.equal(enderecoPermitido(ok), true, ok);
  }
  for (const nao of ['192.168.68.10', '8.8.8.8', '10.0.0.9', undefined, '', 'fd7a:115c:a1e0::1']) {
    assert.equal(enderecoPermitido(nao), false, String(nao));
  }
});
