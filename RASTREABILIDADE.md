# Rastreabilidade — sala limpa do Fio Raiz

**Data:** 2026-11-04 · **Produto:** `fio-raiz` · **Licença:** MIT (nosso copyright)

## Quem implementou

O mesmo agente que entregou a fase 1 da Fábrica de Réplicas (edição derivada do
openwa). **Isso é uma desqualificação formal da sala limpa** e fica registrado
aqui, como a especificação exige: na fase 1 eu li trechos de `src/` do alvo
(principalmente o módulo do MCP e a composição de módulos do NestJS) para
verificar se o servidor subia.

Consequência declarada: o código do Fio Raiz **não é sala limpa no sentido
estrito**. Ele é escrito do zero, com contrato público e comportamento
observado, mas o autor teve contato prévio com a implementação do alvo. A
evidência de não cópia abaixo vale como prova técnica, não como pureza de
processo.

## Fontes usadas na fase 2

| Fonte | Usada | Como |
| --- | --- | --- |
| `openapi.json` público (164 rotas) | sim | inventário de rotas e formatos; nada de texto ou código |
| serviço do alvo rodando (black box) | sim, na fase 1 | medir respostas e recusas; já registrado em `docs/execucao-v2.md` da Fábrica |
| README e documentação pública | não, na fase 2 | o contrato de rotas bastou |
| `src/`, `dashboard/`, `sdk/` do alvo | **não**, na fase 2 | nenhum arquivo lido durante a escrita deste repositório |

## Evidência de não cópia

1. **Histórico próprio** — este repositório nasce em `git init` com commits
   autorais; não há fork, remote herdado nem `ORIGEM.json`.
2. **Hash** — `python3 scripts/conferir-hashes.py` compara cada arquivo do
   repositório com o manifesto do alvo (`referencias/openwa-sha256.txt` da
   Fábrica): zero colisões.
3. **Stack divergente** — Node `node:http` + `node:sqlite` + TypeScript, sem
   NestJS, sem ORM, sem framework HTTP, sem dependência de produção. O alvo usa
   NestJS/TypeORM.
4. **Nomes próprios** — tabelas (`sessoes`, `mensagens`, `entregas`), campos
   (`conversa`, `midia`, `entregue`) e ferramentas MCP em português/inglês
   nossos. A superfície HTTP mantém os caminhos públicos, que são contrato de
   interoperabilidade, não implementação.
5. **Texto próprio** — README, MANUAL, BRANDBOOK e NOTICE escritos para este
   produto; nenhuma frase copiada de documentação de terceiro.

## Licença

MIT com copyright do Voltolini Space (ver LICENSE). O NOTICE declara que não há
código de terceiro e que a superfície pública foi estudada como contrato. Não há
obrigação de aviso de outro produto, porque não há código derivado.
