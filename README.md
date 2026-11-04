# Fio Raiz

Gateway de WhatsApp auto-hospedado com API HTTP, MCP e painel — escrito do zero,
sem dependências de produção, em Node 24 + TypeScript e SQLite embutido.

- **API HTTP** com chave em `x-api-key`: sessões, mensagens, contatos, etiquetas,
  grupos, webhooks, busca, estatísticas, configurações e chaves.
- **MCP** em `POST /mcp` (JSON-RPC 2.0) com 10 ferramentas próprias.
- **Painel** de leitura em `GET /painel`, sem build e sem framework.
- **Zero dependências de produção**: `npm ci` não baixa runtime; o banco é
  `node:sqlite`, o servidor é `node:http`.

## Começar

```bash
git clone https://github.com/Voltolini-SPACE/fio-raiz && cd fio-raiz
npm ci            # só ferramentas de desenvolvimento (typescript)
npm test          # 23 testes, node --test
npm start         # http://127.0.0.1:2790
```

A chave nasce em `data/.api-key` com modo `0600`. Use:

```bash
CHAVE=$(cat data/.api-key)
curl -s http://127.0.0.1:2790/api/health
curl -s -H "x-api-key: $CHAVE" -X POST -H 'content-type: application/json' \
  -d '{"nome":"Atendimento"}' http://127.0.0.1:2790/api/sessions
```

## O que já funciona

Sessões com ciclo de vida (criar, iniciar, parar, parear, status, QR), envio de
texto e mídia, listagem paginada, contatos, etiquetas, grupos, webhooks com
entrega e histórico de falha, busca, estatísticas, configurações, chaves de API,
MCP e painel. Há um **motor real de WhatsApp** opcional (Baileys, carregado por
`import()` dinâmico) que emite QR de verdade e recebe mensagens; o padrão continua
sendo o motor simulado, sem rede. O ensaio real está em [EVIDENCIA.md](EVIDENCIA.md).

## Motor real (opcional)

```bash
npm i baileys@7.0.0-rc14      # não entra em dependencies; é opt-in explícito
FIO_RAIZ_MOTOR=baileys npm start
```

Criar sessão com `"motor":"baileys"`, chamar `/start` e ler `/qr` devolve o QR
emitido pelo WhatsApp. O adaptador reconecta com espera exponencial e desiste em
`401/403/405` (aparelho deslogado). Sessão fica em `data/sessoes/<id>/auth`.

**Risco declarado:** conexão não oficial viola os termos do WhatsApp e pode levar
o número a bloqueio. Use um número dedicado. A conexão completa depende de ler o
QR com um aparelho — verificado até a emissão do QR, não além.

## Limites declarados

- O transporte real não é dependência do produto: sem `baileys` instalado, o
  motor simulado segue sendo o padrão e o adaptador responde `motor_indisponivel`
  com a instrução de instalação. A conexão com um celular de verdade não foi
  verificada — só a emissão do QR pelo servidor do WhatsApp.
- Plugins, ingress, integrações, exportação/importação, métricas Prometheus e
  auditoria não estão implementados — cada rota aparece em PARIDADE.md como
  `excluído`, com data.
- Não há paridade 100% com nenhum outro produto, e não é o objetivo.

## Documentos

| Arquivo | Para quê |
| --- | --- |
| [MANUAL.md](MANUAL.md) | instalar, operar, diagnosticar |
| [BRANDBOOK.md](BRANDBOOK.md) | marca, voz, cores, tipografia |
| [PARIDADE.md](PARIDADE.md) | rota a rota: implementado, adaptado ou excluído |
| [RASTREABILIDADE.md](RASTREABILIDADE.md) | origem do código, fontes consultadas, sala limpa |
| [EVIDENCIA.md](EVIDENCIA.md) | ensaio real de ponta a ponta |

Licença MIT — [LICENSE](LICENSE) · [NOTICE](NOTICE).
