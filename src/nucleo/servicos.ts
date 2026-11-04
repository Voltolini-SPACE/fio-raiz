import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Banco } from './banco.ts';
import { agora } from './banco.ts';
import { ErroHttp, conflito, invalido, naoEncontrado } from './erros.ts';
import { validarUrlPublica } from './validar.ts';
import type { MensagemEntrada } from '../motor/eventos.ts';
import type { Motor } from '../motor/porta.ts';

const id = (p: string) => `${p}_${randomUUID()}`;

export interface Sessao {
  id: string; nome: string; motor: string; estado: string; numero: string | null;
  qr: string | null; criada_em: string; atualizada_em: string;
}

function umaSessao(banco: Banco, sessaoId: string): Sessao {
  const linha = banco.prepare('SELECT * FROM sessoes WHERE id = ?').get(sessaoId) as Sessao | undefined;
  if (!linha) throw naoEncontrado('sessão');
  return linha;
}

const COLUNAS_PUBLICAS = 'id, nome, motor, estado, numero, criada_em, atualizada_em';

export function listarSessoes(banco: Banco): Array<Omit<Sessao, 'qr'>> {
  return banco.prepare(`SELECT ${COLUNAS_PUBLICAS} FROM sessoes ORDER BY criada_em DESC`)
    .all() as unknown as Array<Omit<Sessao, 'qr'>>;
}

export function obterSessao(banco: Banco, sessaoId: string): Sessao {
  return umaSessao(banco, sessaoId);
}

export function criarSessao(banco: Banco, nome: string, motorNome = 'simulado'): Sessao {
  const sessao: Sessao = {
    id: id('ses'), nome, motor: motorNome, estado: 'criada', numero: null, qr: null,
    criada_em: agora(), atualizada_em: agora(),
  };
  banco.prepare(`INSERT INTO sessoes (id, nome, motor, estado, numero, qr, criada_em, atualizada_em)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(sessao.id, sessao.nome, sessao.motor, sessao.estado, sessao.numero, sessao.qr,
      sessao.criada_em, sessao.atualizada_em);
  return sessao;
}

export function removerSessao(banco: Banco, sessaoId: string, pastaDados?: string): { removida: string } {
  umaSessao(banco, sessaoId);
  for (const tabela of ['mensagens', 'contatos', 'etiquetas', 'grupos', 'webhooks']) {
    if (tabela === 'webhooks') {
      banco.prepare('DELETE FROM webhooks WHERE sessao_id = ?').run(sessaoId);
      continue;
    }
    banco.prepare(`DELETE FROM ${tabela} WHERE sessao_id = ?`).run(sessaoId);
  }
  banco.prepare('DELETE FROM sessoes WHERE id = ?').run(sessaoId);
  if (pastaDados) rmSync(join(pastaDados, 'sessoes', sessaoId), { recursive: true, force: true });
  return { removida: sessaoId };
}

export async function iniciarSessao(banco: Banco, motor: Motor, sessaoId: string): Promise<Sessao> {
  const sessao = umaSessao(banco, sessaoId);
  if (sessao.estado === 'conectada') throw conflito('sessão já está conectada');
  banco.prepare('UPDATE sessoes SET estado = ?, atualizada_em = ? WHERE id = ?')
    .run('iniciando', agora(), sessaoId);
  const resultado = await motor.iniciar(sessaoId);
  banco.prepare('UPDATE sessoes SET estado = ?, qr = COALESCE(?, qr), atualizada_em = ? WHERE id = ?')
    .run(resultado.estado, resultado.qr ?? null, agora(), sessaoId);
  return umaSessao(banco, sessaoId);
}

export async function pararSessao(banco: Banco, motor: Motor, sessaoId: string): Promise<Sessao> {
  umaSessao(banco, sessaoId);
  const estado = await motor.parar(sessaoId);
  banco.prepare('UPDATE sessoes SET estado = ?, atualizada_em = ? WHERE id = ?')
    .run(estado, agora(), sessaoId);
  return umaSessao(banco, sessaoId);
}

/** Estado vindo do motor real (QR, conexão, queda) gravado na sessão. */
export function registrarEstado(banco: Banco, sessaoId: string, estado: string, qr: string | null): void {
  banco.prepare('UPDATE sessoes SET estado = ?, qr = COALESCE(?, qr), atualizada_em = ? WHERE id = ?')
    .run(estado, qr, agora(), sessaoId);
}

/** Mensagem recebida do WhatsApp: entra na conversa e dispara `message.recebida`. */
export function registrarEntrada(banco: Banco, sessaoId: string, mensagem: MensagemEntrada): void {
  if (!banco.prepare('SELECT 1 FROM sessoes WHERE id = ?').get(sessaoId)) return;
  banco.prepare(`INSERT OR IGNORE INTO mensagens (id, sessao_id, direcao, conversa, tipo, corpo, midia, estado, criada_em)
                 VALUES (?, ?, 'entrada', ?, ?, ?, ?, 'recebida', ?)`)
    .run(mensagem.id, sessaoId, mensagem.conversa, mensagem.tipo, mensagem.corpo, mensagem.midia,
      new Date(mensagem.recebida_em).toISOString());
  void dispararEvento(banco, 'message.recebida', { sessao_id: sessaoId, mensagem }).catch(() => undefined);
}

/** Pareamento: com motor real pede o código ao WhatsApp; no simulado fecha o ciclo local. */
export async function parearSessao(banco: Banco, motor: Motor, sessaoId: string, numero: string): Promise<Sessao & { codigo?: string }> {
  umaSessao(banco, sessaoId);
  const codigo = motor.parear ? await motor.parear(sessaoId, numero) : null;
  const estado = codigo ? 'aguardando_qr' : 'conectada';
  banco.prepare('UPDATE sessoes SET estado = ?, numero = ?, atualizada_em = ? WHERE id = ?')
    .run(estado, numero, agora(), sessaoId);
  const sessao = umaSessao(banco, sessaoId);
  return codigo ? { ...sessao, codigo: codigo.codigo } : sessao;
}

export function statusSessao(banco: Banco, sessaoId: string) {
  const sessao = umaSessao(banco, sessaoId);
  return { id: sessao.id, estado: sessao.estado, numero: sessao.numero, atualizada_em: sessao.atualizada_em };
}

export function qrDaSessao(banco: Banco, sessaoId: string) {
  const sessao = umaSessao(banco, sessaoId);
  if (!sessao.qr) throw naoEncontrado('QR (inicie a sessão primeiro)');
  return { sessao_id: sessao.id, qr: sessao.qr, estado: sessao.estado };
}

export function listarMensagens(banco: Banco, sessaoId: string, limite = 50, antes?: string) {
  umaSessao(banco, sessaoId);
  const linhas = antes
    ? banco.prepare(`SELECT * FROM mensagens WHERE sessao_id = ? AND criada_em < ?
                     ORDER BY criada_em DESC LIMIT ?`).all(sessaoId, antes, limite)
    : banco.prepare(`SELECT * FROM mensagens WHERE sessao_id = ?
                     ORDER BY criada_em DESC LIMIT ?`).all(sessaoId, limite);
  return { sessao_id: sessaoId, limite, itens: linhas };
}

function exigirConectada(banco: Banco, sessaoId: string): Sessao {
  const sessao = umaSessao(banco, sessaoId);
  if (sessao.estado !== 'conectada') throw conflito('sessão não está conectada');
  return sessao;
}

async function enviar(banco: Banco, motor: Motor, sessaoId: string, conversa: string,
                      tipo: 'texto' | 'midia', corpo: string | null, midia: string | null) {
  exigirConectada(banco, sessaoId);
  if (tipo === 'texto') await motor.enviarTexto(sessaoId, conversa, corpo ?? '');
  else await motor.enviarMidia(sessaoId, conversa, midia ?? '', corpo ?? undefined);
  const mensagem = {
    id: id('msg'), sessao_id: sessaoId, direcao: 'saida', conversa, tipo,
    corpo, midia, estado: 'enviada', criada_em: agora(),
  };
  banco.prepare(`INSERT INTO mensagens (id, sessao_id, direcao, conversa, tipo, corpo, midia, estado, criada_em)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(mensagem.id, mensagem.sessao_id, mensagem.direcao, mensagem.conversa, mensagem.tipo,
      mensagem.corpo, mensagem.midia, mensagem.estado, mensagem.criada_em);
  await dispararEvento(banco, 'message.enviada', { sessao_id: sessaoId, mensagem });
  return mensagem;
}

export function enviarTexto(banco: Banco, motor: Motor, sessaoId: string, conversa: string, texto: string) {
  if (!texto.trim()) throw invalido('texto é obrigatório');
  return enviar(banco, motor, sessaoId, conversa, 'texto', texto, null);
}

export function enviarMidia(banco: Banco, motor: Motor, sessaoId: string, conversa: string,
                            midia: string, legenda?: string) {
  if (!/^https?:\/\//.test(midia) && !midia.startsWith('data:')) {
    throw invalido('midia deve ser URL http(s) ou data:');
  }
  return enviar(banco, motor, sessaoId, conversa, 'midia', legenda ?? null, midia);
}

export function listarContatos(banco: Banco, sessaoId: string) {
  umaSessao(banco, sessaoId);
  return { itens: banco.prepare('SELECT * FROM contatos WHERE sessao_id = ? ORDER BY nome').all(sessaoId) };
}

export function listarEtiquetas(banco: Banco, sessaoId: string) {
  umaSessao(banco, sessaoId);
  return { itens: banco.prepare('SELECT * FROM etiquetas WHERE sessao_id = ? ORDER BY nome').all(sessaoId) };
}

export function listarGrupos(banco: Banco, sessaoId: string) {
  umaSessao(banco, sessaoId);
  return { itens: banco.prepare('SELECT * FROM grupos WHERE sessao_id = ? ORDER BY nome').all(sessaoId) };
}

export function criarContato(banco: Banco, sessaoId: string, jid: string, nome: string) {
  umaSessao(banco, sessaoId);
  banco.prepare(`INSERT INTO contatos (id, sessao_id, jid, nome, criado_em) VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(sessao_id, jid) DO UPDATE SET nome = excluded.nome`)
    .run(id('ctt'), sessaoId, jid, nome, agora());
  return banco.prepare('SELECT * FROM contatos WHERE sessao_id = ? AND jid = ?').get(sessaoId, jid);
}

// Webhooks: assinatura, lista, remoção e entrega com tentativa registrada.
export function listarWebhooks(banco: Banco) {
  const linhas = banco.prepare('SELECT * FROM webhooks ORDER BY criado_em DESC').all() as Array<Record<string, unknown>>;
  return { itens: linhas.map((l) => ({ ...l, segredo: 'oculto' })) };
}

export function criarWebhook(banco: Banco, url: string, eventos: string[], sessaoId?: string) {
  validarUrlPublica(url);
  if (eventos.length === 0) throw invalido('informe ao menos um evento');
  if (sessaoId) umaSessao(banco, sessaoId);
  const webhook = {
    id: id('whk'), url, eventos: JSON.stringify(eventos), sessao_id: sessaoId ?? null,
    segredo: `whsec_${randomBytes(16).toString('hex')}`, ativo: 1, criado_em: agora(),
  };
  banco.prepare(`INSERT INTO webhooks (id, url, eventos, sessao_id, segredo, ativo, criado_em)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(webhook.id, webhook.url, webhook.eventos, webhook.sessao_id, webhook.segredo, webhook.ativo,
      webhook.criado_em);
  return webhook;
}

export function removerWebhook(banco: Banco, webhookId: string) {
  const linha = banco.prepare('SELECT id FROM webhooks WHERE id = ?').get(webhookId);
  if (!linha) throw naoEncontrado('webhook');
  banco.prepare('DELETE FROM webhooks WHERE id = ?').run(webhookId);
  return { removido: webhookId };
}

export function falhasDeEntrega(banco: Banco) {
  return { itens: banco.prepare("SELECT * FROM entregas WHERE estado != 'entregue' ORDER BY criada_em DESC LIMIT 100").all() };
}

export async function dispararEvento(banco: Banco, evento: string, dados: unknown): Promise<void> {
  const alvos = banco.prepare('SELECT * FROM webhooks WHERE ativo = 1').all() as Array<{
    id: string; url: string; eventos: string; segredo: string; sessao_id: string | null;
  }>;
  const carga = JSON.stringify({ evento, dados, enviado_em: agora() });
  for (const alvo of alvos) {
    const assinados = JSON.parse(alvo.eventos) as string[];
    if (!assinados.includes(evento) && !assinados.includes('*')) continue;
    if (alvo.sessao_id && typeof dados === 'object' && dados !== null
        && (dados as Record<string, unknown>).sessao_id !== alvo.sessao_id) continue;
    let estado = 'falhou';
    let codigo: number | null = null;
    let erro: string | null = null;
    let tentativas = 0;
    for (let tentativa = 1; tentativa <= 2; tentativa += 1) {
      tentativas = tentativa;
      try {
        const resposta = await fetch(alvo.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-fio-assinatura': `sha256=${createHmac('sha256', alvo.segredo).update(carga).digest('hex')}`,
          },
          body: carga,
          signal: AbortSignal.timeout(5000),
        });
        codigo = resposta.status;
        estado = resposta.ok ? 'entregue' : 'falhou';
        if (resposta.ok) break;
      } catch (causa) {
        erro = causa instanceof Error ? causa.message.slice(0, 200) : 'falha de rede';
      }
    }
    banco.prepare(`INSERT INTO entregas (id, webhook_id, evento, estado, tentativas, codigo, erro, criada_em)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id('ent'), alvo.id, evento, estado, tentativas, codigo, erro, agora());
  }
}

export function buscar(banco: Banco, termo: string, limite = 25) {
  const alvo = `%${termo}%`;
  const mensagens = banco.prepare(`SELECT id, sessao_id, conversa, corpo, criada_em FROM mensagens
                                   WHERE corpo LIKE ? ORDER BY criada_em DESC LIMIT ?`).all(alvo, limite);
  const contatos = banco.prepare('SELECT id, sessao_id, jid, nome FROM contatos WHERE nome LIKE ? LIMIT ?')
    .all(alvo, limite);
  return { termo, mensagens, contatos };
}

/** Processo novo não tem socket aberto: estado persistido vira `parada` para permitir /start. */
export function sessoesConectadas(banco: Banco): string[] {
  return (banco.prepare("SELECT id FROM sessoes WHERE estado = 'conectada' ORDER BY criada_em").all() as Array<{ id: string }>)
    .map((linha) => linha.id);
}

export function reposicionarSessoes(banco: Banco): number {
  const r = banco.prepare(`UPDATE sessoes SET estado = 'parada', qr = NULL, atualizada_em = ?
                           WHERE estado IN ('conectada', 'iniciando', 'aguardando_qr')`).run(agora());
  return Number(r.changes ?? 0);
}

export function visaoGeral(banco: Banco) {
  const contar = (sql: string) => (banco.prepare(sql).get() as { c: number }).c;
  return {
    sessoes: contar('SELECT COUNT(*) c FROM sessoes'),
    conectadas: contar("SELECT COUNT(*) c FROM sessoes WHERE estado = 'conectada'"),
    mensagens: contar('SELECT COUNT(*) c FROM mensagens'),
    webhooks: contar('SELECT COUNT(*) c FROM webhooks'),
    entregas_falhas: contar("SELECT COUNT(*) c FROM entregas WHERE estado != 'entregue'"),
    observado_em: agora(),
  };
}

export function estatisticasMensagens(banco: Banco, sessaoId?: string) {
  const filtro = sessaoId ? 'WHERE sessao_id = ?' : '';
  const params = sessaoId ? [sessaoId] : [];
  const porDia = banco.prepare(`SELECT substr(criada_em, 1, 10) dia, direcao, COUNT(*) total
                                FROM mensagens ${filtro} GROUP BY dia, direcao ORDER BY dia DESC LIMIT 30`)
    .all(...params);
  const total = (banco.prepare(`SELECT COUNT(*) c FROM mensagens ${filtro}`).get(...params) as { c: number }).c;
  return { total, por_dia: porDia, sessao_id: sessaoId ?? null };
}

export function lerConfiguracoes(banco: Banco) {
  const linhas = banco.prepare('SELECT chave, valor FROM configuracoes').all() as Array<{ chave: string; valor: string }>;
  const config: Record<string, unknown> = {};
  for (const { chave, valor } of linhas) {
    try { config[chave] = JSON.parse(valor) as unknown; } catch { config[chave] = valor; }
  }
  return config;
}

export function gravarConfiguracoes(banco: Banco, entradas: Record<string, unknown>) {
  for (const [chave, valor] of Object.entries(entradas)) {
    banco.prepare('INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor')
      .run(chave, JSON.stringify(valor));
  }
  return lerConfiguracoes(banco);
}

export { ErroHttp };
