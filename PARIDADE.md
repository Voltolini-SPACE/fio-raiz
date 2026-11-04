# Paridade — Fio Raiz contra o contrato público

**Gerado por** `scripts/paridade.py` a partir de inventário commitado em `scripts/rotas-contrato.json` (204 pares).
Estados: `implementado` (existe, com teste), `adaptado` (mesma intenção, forma nossa) e `excluído` (não existe, declarado com data).

## Resumo

- implementado: 28
- excluído: 176
- adaptado: 1 (`POST /api/sessions/{id}/pair`, rota nossa; o alvo não a tem)

## Rotas implementadas

| Método | Rota | Estado | Teste |
| --- | --- | --- | --- |
| DELETE | `/api/auth/api-keys/{id}` | implementado | testes/auth.test.ts |
| DELETE | `/api/sessions/{id}` | implementado | testes/sessoes.test.ts |
| GET | `/api/auth/api-keys` | implementado | testes/auth.test.ts |
| GET | `/api/auth/api-keys/{id}` | implementado | testes/auth.test.ts |
| GET | `/api/health` | implementado | testes/saude.test.ts |
| GET | `/api/health/live` | implementado | testes/saude.test.ts |
| GET | `/api/health/ready` | implementado | testes/saude.test.ts |
| GET | `/api/search` | implementado | testes/sessoes.test.ts |
| GET | `/api/sessions` | implementado | testes/sessoes.test.ts |
| GET | `/api/sessions/{id}` | implementado | testes/sessoes.test.ts |
| GET | `/api/sessions/{id}/contacts` | implementado | testes/sessoes.test.ts |
| GET | `/api/sessions/{id}/groups` | implementado | testes/sessoes.test.ts |
| GET | `/api/sessions/{id}/labels` | implementado | testes/sessoes.test.ts |
| GET | `/api/sessions/{id}/messages` | implementado | testes/sessoes.test.ts |
| GET | `/api/sessions/{id}/qr` | implementado | testes/sessoes.test.ts |
| GET | `/api/sessions/{id}/status` | implementado | testes/sessoes.test.ts |
| GET | `/api/settings` | implementado | testes/auth.test.ts |
| GET | `/api/stats/messages` | implementado | testes/sessoes.test.ts |
| GET | `/api/stats/overview` | implementado | testes/sessoes.test.ts |
| GET | `/api/webhooks` | implementado | testes/webhooks.test.ts |
| GET | `/api/webhooks/delivery-failures` | implementado | testes/webhooks.test.ts |
| POST | `/api/auth/api-keys` | implementado | testes/auth.test.ts |
| POST | `/api/auth/api-keys/{id}/revoke` | implementado | testes/auth.test.ts |
| POST | `/api/auth/validate` | implementado | testes/auth.test.ts |
| POST | `/api/sessions` | implementado | testes/sessoes.test.ts |
| POST | `/api/sessions/{id}/messages/send-text` | implementado | testes/sessoes.test.ts |
| POST | `/api/sessions/{id}/start` | implementado | testes/sessoes.test.ts |
| POST | `/api/sessions/{id}/stop` | implementado | testes/sessoes.test.ts |
| POST | `/api/sessions/{id}/pair` | adaptado | testes/sessoes.test.ts |

## Rotas excluídas (2026-11-04)

Tudo o que não aparece acima. Motivo comum: plugin/ingress/integração, exportação de dados, métricas Prometheus, auditoria, painel completo, SDK e o pacote de administração de sessões além do ciclo básico. Cada linha abaixo é ausência declarada, não pendência escondida.

| Método | Rota | Estado |
| --- | --- | --- |
| DELETE | `/api/ingress/{id}/{id}/{id}` | excluído |
| DELETE | `/api/integration/plugins/{id}/instances/{id}` | excluído |
| DELETE | `/api/plugins/{id}` | excluído |
| DELETE | `/api/sessions/{id}/automation-rules/{id}` | excluído |
| DELETE | `/api/sessions/{id}/channels/{id}` | excluído |
| DELETE | `/api/sessions/{id}/chats/{id}/messages` | excluído |
| DELETE | `/api/sessions/{id}/contacts/{id}` | excluído |
| DELETE | `/api/sessions/{id}/contacts/{id}/block` | excluído |
| DELETE | `/api/sessions/{id}/groups/{id}/participants` | excluído |
| DELETE | `/api/sessions/{id}/groups/{id}/picture` | excluído |
| DELETE | `/api/sessions/{id}/labels/chat/{id}/{id}` | excluído |
| DELETE | `/api/sessions/{id}/labels/{id}` | excluído |
| DELETE | `/api/sessions/{id}/profile/picture` | excluído |
| DELETE | `/api/sessions/{id}/status/{id}` | excluído |
| DELETE | `/api/sessions/{id}/templates/{id}` | excluído |
| DELETE | `/api/sessions/{id}/webhooks/{id}` | excluído |
| GET | `/api/audit` | excluído |
| GET | `/api/infra/config` | excluído |
| GET | `/api/infra/engines` | excluído |
| GET | `/api/infra/engines/current` | excluído |
| GET | `/api/infra/export-data` | excluído |
| GET | `/api/infra/health` | excluído |
| GET | `/api/infra/status` | excluído |
| GET | `/api/infra/storage/export` | excluído |
| GET | `/api/infra/storage/files/count` | excluído |
| GET | `/api/infra/update-check` | excluído |
| GET | `/api/ingress/{id}/{id}/{id}` | excluído |
| GET | `/api/integration/plugins/{id}/instances` | excluído |
| GET | `/api/integration/plugins/{id}/instances/{id}` | excluído |
| GET | `/api/metrics` | excluído |
| GET | `/api/plugins` | excluído |
| GET | `/api/plugins/catalog` | excluído |
| GET | `/api/plugins/{id}` | excluído |
| GET | `/api/plugins/{id}/config-ui` | excluído |
| GET | `/api/plugins/{id}/health` | excluído |
| GET | `/api/sessions/stats/overview` | excluído |
| GET | `/api/sessions/{id}/automation-rules` | excluído |
| GET | `/api/sessions/{id}/automation-rules/{id}` | excluído |
| GET | `/api/sessions/{id}/catalog` | excluído |
| GET | `/api/sessions/{id}/catalog/products` | excluído |
| GET | `/api/sessions/{id}/catalog/products/{id}` | excluído |
| GET | `/api/sessions/{id}/channels` | excluído |
| GET | `/api/sessions/{id}/channels/{id}` | excluído |
| GET | `/api/sessions/{id}/channels/{id}/messages` | excluído |
| GET | `/api/sessions/{id}/chats` | excluído |
| GET | `/api/sessions/{id}/config` | excluído |
| GET | `/api/sessions/{id}/contacts/blocked` | excluído |
| GET | `/api/sessions/{id}/contacts/check/{id}` | excluído |
| GET | `/api/sessions/{id}/contacts/profile-pictures` | excluído |
| GET | `/api/sessions/{id}/contacts/{id}` | excluído |
| GET | `/api/sessions/{id}/contacts/{id}/lid` | excluído |
| GET | `/api/sessions/{id}/contacts/{id}/phone` | excluído |
| GET | `/api/sessions/{id}/contacts/{id}/profile-picture` | excluído |
| GET | `/api/sessions/{id}/groups/join-info` | excluído |
| GET | `/api/sessions/{id}/groups/{id}` | excluído |
| GET | `/api/sessions/{id}/groups/{id}/invite-code` | excluído |
| GET | `/api/sessions/{id}/groups/{id}/membership-requests` | excluído |
| GET | `/api/sessions/{id}/groups/{id}/picture` | excluído |
| GET | `/api/sessions/{id}/groups/{id}/settings` | excluído |
| GET | `/api/sessions/{id}/labels/chat/{id}` | excluído |
| GET | `/api/sessions/{id}/labels/{id}` | excluído |
| GET | `/api/sessions/{id}/labels/{id}/chats` | excluído |
| GET | `/api/sessions/{id}/media/convert` | excluído |
| GET | `/api/sessions/{id}/messages/batch/{id}` | excluído |
| GET | `/api/sessions/{id}/messages/{id}/history` | excluído |
| GET | `/api/sessions/{id}/messages/{id}/{id}/media` | excluído |
| GET | `/api/sessions/{id}/messages/{id}/{id}/reactions` | excluído |
| GET | `/api/sessions/{id}/messages/{id}/{id}/receipts` | excluído |
| GET | `/api/sessions/{id}/presence/{id}` | excluído |
| GET | `/api/sessions/{id}/proxy` | excluído |
| GET | `/api/sessions/{id}/status/{id}` | excluído |
| GET | `/api/sessions/{id}/status/{id}/media` | excluído |
| GET | `/api/sessions/{id}/templates` | excluído |
| GET | `/api/sessions/{id}/templates/{id}` | excluído |
| GET | `/api/sessions/{id}/webhooks` | excluído |
| GET | `/api/sessions/{id}/webhooks/{id}` | excluído |
| GET | `/api/stats/sessions/{id}` | excluído |
| PATCH | `/api/ingress/{id}/{id}/{id}` | excluído |
| PATCH | `/api/integration/plugins/{id}/instances/{id}` | excluído |
| PATCH | `/api/sessions/{id}/config` | excluído |
| PATCH | `/api/sessions/{id}/proxy` | excluído |
| POST | `/api/infra/import-data` | excluído |
| POST | `/api/infra/restart` | excluído |
| POST | `/api/infra/storage/import` | excluído |
| POST | `/api/ingress/{id}/{id}/{id}` | excluído |
| POST | `/api/integration/instances/{id}/{id}/redrive` | excluído |
| POST | `/api/integration/plugins/{id}/instances` | excluído |
| POST | `/api/integration/plugins/{id}/instances/{id}/regenerate-secret` | excluído |
| POST | `/api/plugins/install` | excluído |
| POST | `/api/plugins/install-url` | excluído |
| POST | `/api/plugins/{id}/disable` | excluído |
| POST | `/api/plugins/{id}/enable` | excluído |
| POST | `/api/plugins/{id}/update` | excluído |
| POST | `/api/sessions/{id}/automation-rules` | excluído |
| POST | `/api/sessions/{id}/calls/link` | excluído |
| POST | `/api/sessions/{id}/calls/{id}/reject` | excluído |
| POST | `/api/sessions/{id}/channels` | excluído |
| POST | `/api/sessions/{id}/channels/subscribe` | excluído |
| POST | `/api/sessions/{id}/channels/{id}/admins/demote` | excluído |
| POST | `/api/sessions/{id}/channels/{id}/delete` | excluído |
| POST | `/api/sessions/{id}/channels/{id}/mute` | excluído |
| POST | `/api/sessions/{id}/channels/{id}/owner/transfer` | excluído |
| POST | `/api/sessions/{id}/chats/archive` | excluído |
| POST | `/api/sessions/{id}/chats/delete` | excluído |
| POST | `/api/sessions/{id}/chats/mute` | excluído |
| POST | `/api/sessions/{id}/chats/pin` | excluído |
| POST | `/api/sessions/{id}/chats/read` | excluído |
| POST | `/api/sessions/{id}/chats/typing` | excluído |
| POST | `/api/sessions/{id}/chats/unread` | excluído |
| POST | `/api/sessions/{id}/contacts/{id}/block` | excluído |
| POST | `/api/sessions/{id}/force-kill` | excluído |
| POST | `/api/sessions/{id}/groups` | excluído |
| POST | `/api/sessions/{id}/groups/join` | excluído |
| POST | `/api/sessions/{id}/groups/{id}/invite-code/revoke` | excluído |
| POST | `/api/sessions/{id}/groups/{id}/leave` | excluído |
| POST | `/api/sessions/{id}/groups/{id}/membership-requests/approve` | excluído |
| POST | `/api/sessions/{id}/groups/{id}/membership-requests/reject` | excluído |
| POST | `/api/sessions/{id}/groups/{id}/participants` | excluído |
| POST | `/api/sessions/{id}/groups/{id}/participants/demote` | excluído |
| POST | `/api/sessions/{id}/groups/{id}/participants/promote` | excluído |
| POST | `/api/sessions/{id}/labels/chat/{id}` | excluído |
| POST | `/api/sessions/{id}/logout` | excluído |
| POST | `/api/sessions/{id}/media/convert/video` | excluído |
| POST | `/api/sessions/{id}/media/convert/voice` | excluído |
| POST | `/api/sessions/{id}/messages/batch/{id}/cancel` | excluído |
| POST | `/api/sessions/{id}/messages/click-button` | excluído |
| POST | `/api/sessions/{id}/messages/delete` | excluído |
| POST | `/api/sessions/{id}/messages/edit` | excluído |
| POST | `/api/sessions/{id}/messages/forward` | excluído |
| POST | `/api/sessions/{id}/messages/pin` | excluído |
| POST | `/api/sessions/{id}/messages/react` | excluído |
| POST | `/api/sessions/{id}/messages/reply` | excluído |
| POST | `/api/sessions/{id}/messages/send-audio` | excluído |
| POST | `/api/sessions/{id}/messages/send-bulk` | excluído |
| POST | `/api/sessions/{id}/messages/send-contact` | excluído |
| POST | `/api/sessions/{id}/messages/send-document` | excluído |
| POST | `/api/sessions/{id}/messages/send-image` | excluído |
| POST | `/api/sessions/{id}/messages/send-location` | excluído |
| POST | `/api/sessions/{id}/messages/send-poll` | excluído |
| POST | `/api/sessions/{id}/messages/send-product` | excluído |
| POST | `/api/sessions/{id}/messages/send-sticker` | excluído |
| POST | `/api/sessions/{id}/messages/send-template` | excluído |
| POST | `/api/sessions/{id}/messages/send-video` | excluído |
| POST | `/api/sessions/{id}/messages/star` | excluído |
| POST | `/api/sessions/{id}/messages/unpin` | excluído |
| POST | `/api/sessions/{id}/messages/vote-poll` | excluído |
| POST | `/api/sessions/{id}/pairing-code` | excluído |
| POST | `/api/sessions/{id}/presence/subscribe` | excluído |
| POST | `/api/sessions/{id}/status/send-image` | excluído |
| POST | `/api/sessions/{id}/status/send-text` | excluído |
| POST | `/api/sessions/{id}/status/send-video` | excluído |
| POST | `/api/sessions/{id}/status/send-voice` | excluído |
| POST | `/api/sessions/{id}/templates` | excluído |
| POST | `/api/sessions/{id}/webhooks` | excluído |
| POST | `/api/sessions/{id}/webhooks/{id}/test` | excluído |
| POST | `/api/webhooks/delivery-failures/redrive` | excluído |
| PUT | `/api/auth/api-keys/{id}` | excluído |
| PUT | `/api/infra/config` | excluído |
| PUT | `/api/ingress/{id}/{id}/{id}` | excluído |
| PUT | `/api/plugins/{id}/config` | excluído |
| PUT | `/api/plugins/{id}/config/{id}` | excluído |
| PUT | `/api/plugins/{id}/sessions` | excluído |
| PUT | `/api/sessions/{id}/automation-rules/{id}` | excluído |
| PUT | `/api/sessions/{id}/contacts/{id}` | excluído |
| PUT | `/api/sessions/{id}/groups/{id}/description` | excluído |
| PUT | `/api/sessions/{id}/groups/{id}/member-label` | excluído |
| PUT | `/api/sessions/{id}/groups/{id}/picture` | excluído |
| PUT | `/api/sessions/{id}/groups/{id}/settings` | excluído |
| PUT | `/api/sessions/{id}/groups/{id}/subject` | excluído |
| PUT | `/api/sessions/{id}/labels/{id}` | excluído |
| PUT | `/api/sessions/{id}/presence` | excluído |
| PUT | `/api/sessions/{id}/profile/name` | excluído |
| PUT | `/api/sessions/{id}/profile/picture` | excluído |
| PUT | `/api/sessions/{id}/profile/status` | excluído |
| PUT | `/api/sessions/{id}/templates/{id}` | excluído |
| PUT | `/api/sessions/{id}/webhooks/{id}` | excluído |

## Paridade de núcleo (fora do contrato HTTP)

| Capacidade | Estado | Evidência |
| --- | --- | --- |
| Sessões (ciclo de vida, QR, pareamento) | implementado (simulado padrão; real opcional) | testes/sessoes.test.ts |
| Envio de texto e mídia | implementado | testes/sessoes.test.ts |
| Webhooks com entrega e histórico | implementado | testes/webhooks.test.ts |
| MCP (initialize, tools/list, tools/call) | implementado, 10 ferramentas | testes/mcp.test.ts, mcp/recibo-cliente.json |
| Painel | implementado, leitura | testes/painel.test.ts |
| Transporte real de WhatsApp (Baileys, opt-in) | implementado até o QR; conexão com aparelho **não verificada** | `src/motor/baileys.ts`, testes/motor-baileys.test.ts, EVIDENCIA.md |
| Plugins, ingress, integrações | excluído | — |
| Métricas Prometheus, auditoria, exportação | excluído | — |
| SDK e clientes oficiais | excluído | — |
