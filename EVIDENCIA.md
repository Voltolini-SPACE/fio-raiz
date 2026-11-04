# Evidência de execução — 2026-11-04

Servidor real, banco em `/tmp/fio-raiz-prova`, porta 2791, chave de `data/.api-key`.
Comandos e saídas recortadas; nada aqui é simulação de teste unitário.

## Testes

```
$ npm test
ℹ tests 23
ℹ pass 23
ℹ fail 0
```

```
$ npx tsc --noEmit
$ echo $?
0
```

## HTTP

```
$ curl -s http://127.0.0.1:2791/api/health
{"estado":"ok","servico":"fio-raiz","versao":"0.1.0","uptime_s":2,...}

$ curl -s -X POST -H "x-api-key: $CHAVE" -H 'content-type: application/json' \
    -d '{"nome":"Atendimento"}' http://127.0.0.1:2791/api/sessions
{"id":"ses_899e6683-...","nome":"Atendimento","motor":"simulado","estado":"criada",...}

$ curl -s -X POST -H "x-api-key: $CHAVE" http://127.0.0.1:2791/api/sessions/ses_899e6683-.../start
{"estado":"conectada","qr":"fio:efcc170d6bdc08d72198c2dcea8bfa1c",...}

$ curl -s -X POST -H "x-api-key: $CHAVE" -H 'content-type: application/json' \
    -d '{"para":"5511999998888","texto":"primeira mensagem do Fio Raiz"}' \
    http://127.0.0.1:2791/api/sessions/ses_899e6683-.../messages/send-text
{"conversa":"5511999998888@s.whatsapp.net","tipo":"texto","estado":"enviada",...}

$ curl -s -H "x-api-key: $CHAVE" http://127.0.0.1:2791/api/stats/overview
{"sessoes":1,"conectadas":1,"mensagens":1,"webhooks":0,"entregas_falhas":0,...}
```

## MCP (cliente externo, `scripts/prova-mcp.py`)

```
$ python3 scripts/prova-mcp.py --url http://127.0.0.1:2791/mcp --chave "$CHAVE" \
    --saida mcp/recibo-cliente.json
{"confirmado": true, "ferramentas": 10, "ensaios_ok": 4}
```

Ferramentas listadas: `HealthGet`, `SessionFindAll`, `SessionGetStats`,
`MessageFindAll`, `MessageSendText`, `WebhooksList`, `ContactFindAll`,
`LabelFindAll`, `GroupFindAll`, `SettingsGet`. Recibo completo em
[mcp/recibo-cliente.json](mcp/recibo-cliente.json).

## Não coberto por esta evidência

- Pareamento real de WhatsApp em celular (não há adaptador real; ver PARIDADE.md).
- Entrega de webhook contra serviço externo: coberta por teste com receptor HTTP
  local em `testes/webhooks.test.ts`, não contra a internet.
- Carga, concorrência e recuperação após queda do processo.

## Varredura de hashes contra o alvo (2026-11-04)

```
$ python3 scripts/conferir-hashes.py
arquivos nossos: 40
hashes do alvo: 2291
colisoes: 0
```

Nenhum arquivo do produto coincide com qualquer arquivo do alvo: prova técnica de não cópia,
complementar ao registro de contato prévio em RASTREABILIDADE.md.

## Transporte real de WhatsApp (2026-11-04)

Ambiente: `spark-1ec1`, Node v24.20.0, porta 2793, `FIO_RAIZ_MOTOR=baileys`,
`FIO_RAIZ_DATA=/tmp/fio-raiz-live`.

```
npm i --no-save baileys@7.0.0-rc14   # 70 pacotes; package.json intocado
POST /api/sessions                    {"motor":"baileys","estado":"criada"}
POST /api/sessions/<id>/start         estado=aguardando_qr  (779 ms)
GET  /api/sessions/<id>/qr            estado=aguardando_qr  qr_len=277
                                      prefixo https://wa.me/settings/linked_devices#2@
npm test                              42 testes, 42 verdes, 0 falhas
npx tsc --noEmit                      sem erros
```

O QR acima foi emitido pelo servidor do WhatsApp e servido pela nossa API; nenhum
telefone foi lido. **NÃO VERIFICADO:** conexão completa com um aparelho, recebimento
de mensagem real e reconexão contra queda real de rede — dependem de ler o QR num
celular. Recebimento e envio estão cobertos por teste com socket falso
(`testes/motor-http.test.ts`).

Risco declarado: conexão não oficial, sujeita a bloqueio do número.

## Conexão real com aparelho (2026-11-04, 11:21 -03)

O QR foi aberto no MacBook do dono (página servida por túnel SSH reverso) e lido
no WhatsApp. Cronologia observada na mesma execução:

```
POST /start                      aguardando_qr
GET  /qr (a cada 3 s)            QR renovado pelo WhatsApp
status após ~24 s                conectada
creds.me                         id 5547966•••02 (nome: Voltolini), platform smbi
POST /messages/send-text         {"estado":"enviada"} · msg_b7ac9c3a-…
GET  /messages                   mensagem de saída gravada no histórico
```

O envio chegou ao WhatsApp do próprio número (conversa "você"). **NÃO VERIFICADO:**
recebimento de mensagem de outro aparelho e recibo de entrega/leitura — o produto
não rastreia ack. A sessão ficou ativa em `data/sessoes/` para o teste de entrada.

## CI (2026-11-04)

`.github/workflows/ci.yml` a cada push em `main`: `npm ci`, `npm run check`
(`tsc --noEmit`) e `npm test`. Primeira execução: **run 41847084256**, commit
`a4bc3a7`, conclusão verde; 45 testes no total. Sem `baileys` instalado a suíte
passa e `/start` responde `503 motor_indisponivel` com o comando de instalação.

## Entrada real (2026-11-04, 14:23–14:47 UTC)

Com a sessão pareada, o WhatsApp entregou **46 mensagens** ao gateway sem
intervenção: 45 de canais/grupos (`@newsletter`, `@g.us`) e 1 própria de saída.

```
GET /api/sessions/<id>/messages?limite=200
  total 47 · entrada 46 · saida 1
  tipos: texto, midia
  primeira entrada 14:23:21 · última 14:47:28
  mídia registrada como referência wa-media:<id> (conteúdo não baixado)
```

Isso fecha o caminho real de entrada (socket → tradução → SQLite → API). O
conteúdo das mensagens não é reproduzido aqui: são mensagens de terceiros.
**NÃO VERIFICADO** ainda: download do binário da mídia e recibo de leitura.
