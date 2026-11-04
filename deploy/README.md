# Operação contínua e acesso remoto

## 1. Unit do gateway

`fio-raiz.service` sobe na 2793 com motor Baileys, `Restart=always` e retomada da sessão
que estava conectada. Instalar:

```bash
mkdir -p ~/.config/systemd/user
cp deploy/fio-raiz.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now fio-raiz.service
```

Conferir: `systemctl --user status fio-raiz`, `curl -s http://127.0.0.1:2793/api/health`,
log em `journalctl --user -u fio-raiz -f`. `loginctl enable-linger $USER` já é necessário
para a unit viver sem login (nesta Spark está ligado).

## 2. Acesso pelo Tailscale (Mac e iPad, de qualquer rede)

A Spark entra no tailnet como `spark-1ec1` e a unit escuta em `0.0.0.0` **com portão**:
`FIO_RAIZ_ACESSO=tailnet` aceita só loopback e `100.64.0.0/10`. LAN e internet recebem 403.

| De onde | URL |
|---|---|
| Spark (local) | `http://127.0.0.1:2793` |
| Mac, iPad, iPhone (tailnet) | `http://100.105.131.93:2793` |
| SSH para o Mac | `ssh mac` (HostName = IP do tailnet) |

O painel abre em `/painel` e pede a chave de `data/.api-key`; o MCP é `POST /mcp` com
`x-api-key`. Teste rápido do iPad: Safari em `http://100.105.131.93:2793/painel`, com o app
Tailscale conectado.

Para nome estável com HTTPS falta habilitar *Serve/HTTPS certificates* no console do
tailnet (ação do dono, uma vez): depois `tailscale serve --bg http://127.0.0.1:2793` publica
`https://spark-1ec1.taild147f4.ts.net` e o IP pode sair da config.

Se o IP do nó mudar, ajuste `FIO_RAIZ_HOST` na unit e `HostName` em `~/.ssh/config`.
