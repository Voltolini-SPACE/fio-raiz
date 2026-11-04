import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type Banco = DatabaseSync;

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY, nome TEXT NOT NULL, hash TEXT NOT NULL UNIQUE,
  criada_em TEXT NOT NULL, revogada_em TEXT
);
CREATE TABLE IF NOT EXISTS sessoes (
  id TEXT PRIMARY KEY, nome TEXT NOT NULL, motor TEXT NOT NULL,
  estado TEXT NOT NULL, numero TEXT, qr TEXT, criada_em TEXT NOT NULL, atualizada_em TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS mensagens (
  id TEXT PRIMARY KEY, sessao_id TEXT NOT NULL, direcao TEXT NOT NULL, conversa TEXT NOT NULL,
  tipo TEXT NOT NULL, corpo TEXT, midia TEXT, estado TEXT NOT NULL, criada_em TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS mensagens_por_sessao ON mensagens(sessao_id, criada_em);
CREATE TABLE IF NOT EXISTS contatos (
  id TEXT PRIMARY KEY, sessao_id TEXT NOT NULL, jid TEXT NOT NULL, nome TEXT,
  criado_em TEXT NOT NULL, UNIQUE(sessao_id, jid)
);
CREATE TABLE IF NOT EXISTS etiquetas (
  id TEXT PRIMARY KEY, sessao_id TEXT NOT NULL, nome TEXT NOT NULL, cor TEXT,
  criada_em TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS grupos (
  id TEXT PRIMARY KEY, sessao_id TEXT NOT NULL, jid TEXT NOT NULL, nome TEXT,
  participantes INTEGER NOT NULL DEFAULT 0, criado_em TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY, url TEXT NOT NULL, eventos TEXT NOT NULL, sessao_id TEXT,
  segredo TEXT NOT NULL, ativo INTEGER NOT NULL DEFAULT 1, criado_em TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS entregas (
  id TEXT PRIMARY KEY, webhook_id TEXT NOT NULL, evento TEXT NOT NULL, estado TEXT NOT NULL,
  tentativas INTEGER NOT NULL, codigo INTEGER, erro TEXT, criada_em TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS configuracoes (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
`;

export function abrirBanco(caminho: string): Banco {
  const arquivo = caminho === ':memory:' ? caminho : join(caminho, 'fio-raiz.sqlite');
  if (arquivo !== ':memory:') mkdirSync(dirname(arquivo), { recursive: true });
  const banco = new DatabaseSync(arquivo);
  banco.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  banco.exec(ESQUEMA);
  return banco;
}

export function agora(): string {
  return new Date().toISOString();
}
