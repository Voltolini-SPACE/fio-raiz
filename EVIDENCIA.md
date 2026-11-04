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
