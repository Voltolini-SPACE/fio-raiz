# Manual do Fio Raiz

## 1. Requisitos

- Node.js 22.18 ou superior (o banco usa `node:sqlite`; o código roda em TS
  nativo por type stripping).
- Porta livre (padrão `2790`) e acesso de escrita a `data/`.
- Nenhum serviço externo, nenhum banco instalado, nenhuma dependência de runtime.

## 2. Instalar e subir

```bash
npm ci
npm start
```

Saída esperada: `Fio Raiz em http://127.0.0.1:2790 · chave em <pasta>/data/.api-key`.
Ajustes por ambiente:

| Variável | Padrão | Efeito |
| --- | --- | --- |
| `PORT` | `2790` | porta HTTP |
| `FIO_RAIZ_DATA` | `./data` | pasta do `fio-raiz.sqlite` e do `.api-key` |

`data/.api-key` nasce com modo `0600` e é guardada no banco apenas como
sha256. Perdeu a chave? Apague o arquivo com o serviço parado e suba de novo
(as chaves emitidas via API continuam válidas).

## 3. Autenticar

Toda rota privada exige `x-api-key`. Públicas: `/api/health*` e `/painel`.

```bash
CHAVE=$(cat data/.api-key)
curl -s -H "x-api-key: $CHAVE" http://127.0.0.1:2790/api/stats/overview
```

## 4. Fluxo de sessão

```bash
# criar
curl -s -H "x-api-key: $CHAVE" -H 'content-type: application/json' \
  -d '{"nome":"Atendimento"}' http://127.0.0.1:2790/api/sessions
# iniciar (grava QR e, no motor simulado, conecta)
curl -s -X POST -H "x-api-key: $CHAVE" http://127.0.0.1:2790/api/sessions/<id>/start
# ver QR
curl -s -H "x-api-key: $CHAVE" http://127.0.0.1:2790/api/sessions/<id>/qr
# parear número
curl -s -X POST -H "x-api-key: $CHAVE" -H 'content-type: application/json' \
  -d '{"numero":"5511999998888"}' http://127.0.0.1:2790/api/sessions/<id>/pair
# enviar texto
curl -s -X POST -H "x-api-key: $CHAVE" -H 'content-type: application/json' \
  -d '{"para":"5511999998888","texto":"olá"}' \
  http://127.0.0.1:2790/api/sessions/<id>/messages/send-text
```

`send-media` aceita `midia` como URL `http(s)` ou `data:` e `legenda` opcional.
Enviar em sessão que não está `conectada` responde `409`.

## 5. Webhooks

```bash
curl -s -X POST -H "x-api-key: $CHAVE" -H 'content-type: application/json' \
  -d '{"url":"https://exemplo.test/gancho","eventos":["message.enviada"]}' \
  http://127.0.0.1:2790/api/webhooks
```

Cada entrega leva o cabeçalho `x-fio-assinatura` com o segredo do webhook
(`whsec_…`, devolvido só na criação). São duas tentativas por evento; o
resultado fica em `GET /api/webhooks/delivery-failures`. `eventos` aceita `*`.

## 6. MCP

O cliente fala JSON-RPC 2.0 em `POST /mcp` com `x-api-key`:

```bash
curl -s -X POST -H "x-api-key: $CHAVE" -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' http://127.0.0.1:2790/mcp
python3 scripts/prova-mcp.py --url http://127.0.0.1:2790/mcp --chave "$CHAVE"
```

O segundo comando grava `mcp/recibo-cliente.json` com `confirmado: true` e o
resultado de cada ensaio. Ferramentas: `HealthGet`, `SessionFindAll`,
`SessionGetStats`, `MessageFindAll`, `MessageSendText`, `WebhooksList`,
`ContactFindAll`, `LabelFindAll`, `GroupFindAll`, `SettingsGet`.

## 7. Painel

`http://127.0.0.1:2790/painel` — abra, cole a chave e clique em **Carregar**.
Mostra visão geral, sessões e webhooks. É leitura; escrita é pela API ou MCP.

## 8. Backup e diagnóstico

- Banco: copie `data/fio-raiz.sqlite` (e `-wal`, `-shm`) com o serviço parado,
  ou use `sqlite3 data/fio-raiz.sqlite ".backup /destino/fio-raiz.sqlite"`.
- Sintoma `401 nao_autorizado`: chave ausente/errada/revogada; confira
  `data/.api-key` e `GET /api/auth/api-keys`.
- Sintoma `409 conflito`: sessão já conectada (`start` repetido) ou envio em
  sessão parada.
- Sintoma `500 falha_interna`: a mensagem vem no JSON; os testes cobrem o
  caminho felizes e os erros nomeados (`npm test`).

## 9. Atualizar

`git pull && npm ci && npm test && npm start`. Não há migração destrutiva: o
esquema usa `CREATE TABLE IF NOT EXISTS` e roda a cada partida.
