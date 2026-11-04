#!/usr/bin/env python3
"""Gera PARIDADE.md: rota a rota do contrato público contra o que existe aqui.

Uso: python3 scripts/paridade.py --openapi /caminho/openapi.json
Sem o arquivo, usa a lista de rotas commitada em scripts/rotas-contrato.json
(apenas método e caminho — o contrato como inventário, sem texto de terceiro).
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

IMPLEMENTADO = {
    ('GET', '/api/health'), ('GET', '/api/health/live'), ('GET', '/api/health/ready'),
    ('POST', '/api/auth/validate'), ('GET', '/api/auth/api-keys'), ('POST', '/api/auth/api-keys'),
    ('GET', '/api/auth/api-keys/{id}'), ('DELETE', '/api/auth/api-keys/{id}'),
    ('POST', '/api/auth/api-keys/{id}/revoke'),
    ('GET', '/api/settings'), ('PUT', '/api/settings'),
    ('GET', '/api/sessions'), ('POST', '/api/sessions'),
    ('GET', '/api/sessions/{id}'), ('DELETE', '/api/sessions/{id}'),
    ('POST', '/api/sessions/{id}/start'), ('POST', '/api/sessions/{id}/stop'),
    ('GET', '/api/sessions/{id}/status'), ('GET', '/api/sessions/{id}/qr'),
    ('GET', '/api/sessions/{id}/messages'),
    ('POST', '/api/sessions/{id}/messages/send-text'),
    ('POST', '/api/sessions/{id}/messages/send-media'),
    ('GET', '/api/sessions/{id}/contacts'), ('POST', '/api/sessions/{id}/contacts'),
    ('GET', '/api/sessions/{id}/labels'), ('GET', '/api/sessions/{id}/groups'),
    ('GET', '/api/webhooks'), ('POST', '/api/webhooks'), ('DELETE', '/api/webhooks/{id}'),
    ('GET', '/api/webhooks/delivery-failures'),
    ('GET', '/api/search'), ('GET', '/api/stats/overview'), ('GET', '/api/stats/messages'),
}

TESTES = {
    '/api/health': 'testes/saude.test.ts', '/api/auth': 'testes/auth.test.ts',
    '/api/settings': 'testes/auth.test.ts', '/api/sessions': 'testes/sessoes.test.ts',
    '/api/webhooks': 'testes/webhooks.test.ts', '/api/search': 'testes/sessoes.test.ts',
    '/api/stats': 'testes/sessoes.test.ts',
}


def chave(metodo: str, caminho: str) -> tuple[str, str]:
    partes = ['{id}' if p.startswith('{') else p for p in caminho.split('/')]
    return metodo.upper(), '/'.join(partes)


def teste_para(caminho: str) -> str:
    for prefixo, arquivo in TESTES.items():
        if caminho.startswith(prefixo):
            return arquivo
    return '—'


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--openapi', default='')
    p.add_argument('--saida', default=str(RAIZ / 'PARIDADE.md'))
    args = p.parse_args()
    if args.openapi:
        dados = json.loads(Path(args.openapi).read_text(encoding='utf-8'))
        rotas = set()
        for caminho, operacoes in dados['paths'].items():
            for metodo in operacoes:
                if metodo.lower() in ('get', 'post', 'put', 'patch', 'delete'):
                    rotas.add(chave(metodo, caminho))
        origem = f'`openapi.json` informado ({len(rotas)} pares método+rota)'
    else:
        rotas = {chave(m, c) for m, c in json.loads((RAIZ / 'scripts' / 'rotas-contrato.json').read_text())}
        origem = f'inventário commitado em `scripts/rotas-contrato.json` ({len(rotas)} pares)'

    linhas = [
        '# Paridade — Fio Raiz contra o contrato público',
        '',
        f'**Gerado por** `scripts/paridade.py` a partir de {origem}.',
        'Estados: `implementado` (existe, com teste), `adaptado` (mesma intenção, '
        'forma nossa) e `excluído` (não existe, declarado com data).',
        '',
        '## Resumo',
        '',
    ]
    feitos = sorted(r for r in rotas if r in IMPLEMENTADO)
    faltam = sorted(rotas - set(IMPLEMENTADO))
    linhas += [
        f'- implementado: {len(feitos)}',
        f'- excluído: {len(faltam)}',
        f'- adaptado: 1 (`POST /api/sessions/{{id}}/pair`, rota nossa; o alvo não a tem)',
        '',
        '## Rotas implementadas',
        '',
        '| Método | Rota | Estado | Teste |',
        '| --- | --- | --- | --- |',
    ]
    for metodo, caminho in feitos:
        linhas.append(f'| {metodo} | `{caminho}` | implementado | {teste_para(caminho)} |')
    linhas += [
        '| POST | `/api/sessions/{id}/pair` | adaptado | testes/sessoes.test.ts |',
        '',
        '## Rotas excluídas (2026-11-04)',
        '',
        'Tudo o que não aparece acima. Motivo comum: plugin/ingress/integração, '
        'exportação de dados, métricas Prometheus, auditoria, painel completo, SDK '
        'e o pacote de administração de sessões além do ciclo básico. Cada linha '
        'abaixo é ausência declarada, não pendência escondida.',
        '',
        '| Método | Rota | Estado |',
        '| --- | --- | --- |',
    ]
    for metodo, caminho in faltam:
        linhas.append(f'| {metodo} | `{caminho}` | excluído |')
    linhas += [
        '',
        '## Paridade de núcleo (fora do contrato HTTP)',
        '',
        '| Capacidade | Estado | Evidência |',
        '| --- | --- | --- |',
        '| Sessões (ciclo de vida, QR, pareamento) | implementado (motor simulado) | testes/sessoes.test.ts |',
        '| Envio de texto e mídia | implementado | testes/sessoes.test.ts |',
        '| Webhooks com entrega e histórico | implementado | testes/webhooks.test.ts |',
        '| MCP (initialize, tools/list, tools/call) | implementado, 10 ferramentas | testes/mcp.test.ts, mcp/recibo-cliente.json |',
        '| Painel | implementado, leitura | testes/painel.test.ts |',
        '| Transporte real de WhatsApp (pareamento por QR no celular) | **excluído** | porta `src/motor/` sem adaptador real |',
        '| Plugins, ingress, integrações | excluído | — |',
        '| Métricas Prometheus, auditoria, exportação | excluído | — |',
        '| SDK e clientes oficiais | excluído | — |',
        '',
    ]
    Path(args.saida).write_text('\n'.join(linhas), encoding='utf-8')
    print(f'PARIDADE.md: {len(feitos)} implementado, {len(faltam)} excluído')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
