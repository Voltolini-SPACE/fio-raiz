# Brandbook — Fio Raiz

## Nome e promessa

**Fio Raiz** é o fio que sai da raiz: o gateway é seu, o código é seu. A promessa
é autonomia operacional sem intermediário — o WhatsApp conectado direto no seu
servidor, com API, MCP e painel no mesmo pacote.

- Nome curto: **Fio Raiz**. Slug e pacote: `fio-raiz`.
- Não usar “Fio” sozinho em material externo: confunde com as edições derivadas.
- Assinatura de rodapé: `Fio Raiz · gateway auto-hospedado`.

## Voz

- Direta, técnica, sem hype. Frases curtas. Nada de “revolucionário”.
- Fala em resultado verificável: “23 testes passando”, não “robusto”.
- Trata limite como informação: “o transporte real de WhatsApp ainda não está
  embutido”, não “em breve”.
- Português do Brasil; termos de API em inglês (`sessionId`, `webhook`).

## Cores

| Papel | Hex | Uso |
| --- | --- | --- |
| Raiz | `#1F7A5A` | marca, botões, links, destaque |
| Tinta | `#10231C` | texto principal |
| Papel | `#F4FAF6` | fundo de página |
| Borda | `#CFE3D7` | divisórias, cartões |
| Alerta | `#B4552B` | só erro e falha de entrega |

Contraste do par Raiz/Papel: 5,4:1 (AA para texto normal). Não usar Raiz sobre
Tinta.

## Tipografia

- Texto: pilha do sistema (`ui-sans-serif`, `system-ui`), 15 px, entrelinha 1,5.
- Títulos: mesma pilha, peso 600; `h2` em caixa alta com `letter-spacing: .06em`.
- Código: `ui-monospace`, 13 px; trechos inline com fundo `#EEF6F1`.
- Sem fonte baixada, sem webfont: o painel não depende de CDN.

## Marca gráfica

O símbolo é um fio que desce e enraíza: uma linha vertical com duas raízes
curtas em ângulo. Desenho em traço de 2 px, cor Raiz, sobre Papel. Não usar
ícone de telefone, bolha de chat ou logo de mensageiro — a marca é de
infraestrutura, não de aplicativo de conversa.

## Layout do painel

- Cartões brancos sobre Papel, borda de 1 px, raio 12 px, respiro de 16 px.
- Grade fluida: `minmax(280px, 1fr)`; nada de sidebar fixa.
- Dados em tabela densa, 13 px, sem zebra — a borda inferior basta.
- Estado vazio sempre escrito (`vazio`), nunca em branco.

## O que nunca fazer

- Copiar texto, ícone ou cor de outro gateway.
- Prometer paridade total: o que não existe está em PARIDADE.md com data.
- Usar emoji em documentação ou painel.
