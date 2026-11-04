import { createHash, randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Banco } from './banco.ts';
import { agora } from './banco.ts';

export const hashDe = (chave: string): string => createHash('sha256').update(chave).digest('hex');
const novoId = (prefixo: string): string => `${prefixo}_${randomBytes(9).toString('hex')}`;

/** Chave de máquina: criada uma vez em data/.api-key, modo 0600, guardada só em hash. */
export function semearChave(banco: Banco, pastaDados: string): { chave: string; criada: boolean } {
  mkdirSync(pastaDados, { recursive: true });
  const arquivo = join(pastaDados, '.api-key');
  if (existsSync(arquivo)) {
    const chave = readFileSync(arquivo, 'utf8').trim();
    if (chave.length >= 20) {
      chmodSync(arquivo, 0o600);
      const linha = banco.prepare('SELECT id FROM api_keys WHERE hash = ?').get(hashDe(chave));
      if (!linha) {
        banco.prepare('INSERT INTO api_keys (id, nome, hash, criada_em) VALUES (?, ?, ?, ?)')
          .run(novoId('key'), 'chave-da-maquina', hashDe(chave), agora());
      }
      return { chave, criada: false };
    }
  }
  const chave = `fio_${randomBytes(24).toString('hex')}`;
  writeFileSync(arquivo, `${chave}\n`, { mode: 0o600 });
  chmodSync(arquivo, 0o600);
  banco.prepare('INSERT INTO api_keys (id, nome, hash, criada_em) VALUES (?, ?, ?, ?)')
    .run(novoId('key'), 'chave-da-maquina', hashDe(chave), agora());
  return { chave, criada: true };
}

export function chaveValida(banco: Banco, apresentada: string | undefined): boolean {
  if (!apresentada || apresentada.length < 20) return false;
  const linha = banco.prepare('SELECT id FROM api_keys WHERE hash = ? AND revogada_em IS NULL')
    .get(hashDe(apresentada));
  return Boolean(linha);
}

export function criarChave(banco: Banco, nome: string, segredo?: string) {
  const chave = segredo ?? `fio_${randomBytes(24).toString('hex')}`;
  const id = novoId('key');
  banco.prepare('INSERT INTO api_keys (id, nome, hash, criada_em) VALUES (?, ?, ?, ?)')
    .run(id, nome, hashDe(chave), agora());
  return { id, nome, chave, criada_em: agora() };
}
