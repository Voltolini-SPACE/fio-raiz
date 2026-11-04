# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento: [SemVer](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Operação contínua
- Sessão que estava `conectada` é retomada no boot; `aguardando_qr` volta a `parada`.
- Contador de reconexão zera ao abrir conexão: quedas esparsas não levam a `erro` permanente.
- Baileys passou a `optionalDependencies` (`7.0.0-rc14`): `npm ci` preserva o motor real.
- Units systemd em `deploy/` para o gateway (`Restart=always`) e para o túnel do Mac.

## [0.1.0] — 2026-11-04

Primeira versão pública. Substitui o OpenWA para uso próprio: mesmo recorte de
API, implementação limpa em Node 24 + TypeScript, zero dependência de produção.

### Adicionado

- API HTTP local (`127.0.0.1:2790`) para sessões, mensagens, contatos, etiquetas,
  grupos, webhooks, busca e estatísticas; chave por `x-api-key`.
- Servidor MCP em `POST /mcp` (protocolo `2025-06-18`) com 10 ferramentas e
  recibo de cliente externo.
- Painel web em `/painel`.
- Motor simulado para desenvolvimento e adaptador real Baileys opt-in
  (`FIO_RAIZ_MOTOR=baileys`).
- Webhooks com HMAC-SHA256 do corpo e bloqueio de destino privado (SSRF).
- Reinício devolve sessões a `parada`; `/start` retoma com a credencial salva.
- Rate limit de falhas de chave (20/min por IP).
- Documentação: README, MANUAL, EVIDENCIA, PARIDADE, BRANDBOOK, RASTREABILIDADE.
- CI no GitHub Actions: `npm test` + `tsc --noEmit`.

### Segurança

- `Host` malformado não derruba o processo; JSON-RPC nunca vaza detalhe interno.
- Transporte MCP endurecido: 202 em notificação, 400 em versão incompatível,
  415 em content-type, 403 em `Origin` externa, 405 em GET/DELETE, `-32601` em
  método desconhecido.

### Limitações declaradas

- Conexão WhatsApp não oficial, sujeita a bloqueio do número; use número dedicado.
- Reconexão após queda de rede, download do binário de mídia e recibo de leitura
  **NÃO VERIFICADOS**.
