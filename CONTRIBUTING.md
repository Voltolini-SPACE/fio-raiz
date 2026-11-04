# Contribuindo com o Fio Raiz

Obrigado pelo interesse. Este é um projeto pequeno e opinativo: prefira mudanças
cirúrgicas, com teste que falha antes e passa depois.

## Ambiente

- Node 24+ (o projeto usa `node:sqlite`, TS nativo e `node --test`).
- Zero dependências de produção. `npm install` só instala `typescript` (dev).

```bash
npm install
npm test        # node --test
npm run check   # tsc --noEmit
```

## Fluxo

1. Abra uma issue descrevendo o problema ou a proposta antes de PRs grandes.
2. Faça um branch curto (`fix/…`, `feat/…`).
3. Escreva o teste primeiro; rode `npm test` e `npm run check` verdes.
4. Commits em pt-BR, imperativo, com o porquê no corpo quando não for óbvio.
5. PR com: o que muda, como foi verificado (comando + saída) e o que ficou
   **NÃO VERIFICADO**.

## Regras de código

- Sem dependência de produção nova. Adaptador real (Baileys) é opt-in e nunca
  entra em `dependencies`.
- Erros de entrada viram `ErroHttp` com tipo estável; nada de stack ou detalhe
  interno na resposta.
- Nunca logue chave de API, segredo de webhook, QR ou credencial do WhatsApp.
- Migração de esquema é aditiva; `data/` nunca vai para o git.

## Segurança

Não abra issue pública para vulnerabilidade. Veja [SECURITY.md](SECURITY.md).
