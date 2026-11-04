# Segurança

O Fio Raiz guarda credencial de WhatsApp e uma chave de API que envia mensagens em
nome do dono. Trate como segredo de produção.

## Versões suportadas

| Versão | Suporte |
| --- | --- |
| 0.1.x | sim |
| < 0.1 | não |

## Como reportar

**Não abra issue pública.** Use GitHub Security Advisories
(https://github.com/Voltolini-SPACE/fio-raiz/security/advisories/new) ou escreva
para **space@voltolini.space** com:

- versão/commit e ambiente (Node, SO);
- passos para reproduzir e impacto;
- prova de conceito mínima, sem dado real de terceiro.

Resposta em até 7 dias; correção e crédito combinados com quem reportou.

## Superfície e escopo

- Bind padrão em `127.0.0.1`. Expor em rede sem TLS e proxy autenticado é uso
  incorreto e fica fora do escopo.
- Webhooks: destino público obrigatório (loopback/rede privada/metadata bloqueados)
  e assinatura HMAC-SHA256 do corpo em `x-fio-assinatura`.
- MCP: `POST /mcp` com `x-api-key`; notificações recebem 202, versão de protocolo
  incompatível 400, `Origin` externa 403.
- Relacionamento com o WhatsApp não é oficial. Bloqueio de número por violação dos
  termos do WhatsApp não é vulnerabilidade deste projeto — está declarado no README.
- Fora do escopo: engenharia social, DoS volumétrico, falha em dependência opt-in
  (Baileys) já reportada upstream.

## Boas práticas para quem opera

- Chave em `data/.api-key` (0600) ou `FIO_RAIZ_CHAVE`; rotacione se vazar.
- Nunca versione `data/`; nunca cole QR ou credencial em issue.
