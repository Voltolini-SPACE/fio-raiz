# Operação contínua

Duas units de usuário, ambas com `Restart=always`:

| Arquivo | O que faz |
|---|---|
| `fio-raiz.service` | sobe o gateway na 2793 com motor Baileys; sessão conectada é retomada no boot |
| `fio-raiz-tunel.service` | mantém o túnel `ssh -R 2794` para o Mac |

Instalar e ligar:

```bash
mkdir -p ~/.config/systemd/user
cp deploy/fio-raiz.service deploy/fio-raiz-tunel.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now fio-raiz.service
systemctl --user enable --now fio-raiz-tunel.service   # só se o Mac precisa acessar
```

Conferir: `systemctl --user status fio-raiz` e `curl -s http://127.0.0.1:2793/api/health`.
Log: `journalctl --user -u fio-raiz -f`. Exige `loginctl enable-linger $USER` para viver sem login.
