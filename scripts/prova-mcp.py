#!/usr/bin/env python3
"""Cliente MCP externo de prova: fala com o gateway por HTTP e grava o recibo.

Uso: python3 scripts/prova-mcp.py --url http://127.0.0.1:2790 --chave fio_... --saida mcp/recibo-cliente.json
"""
from __future__ import annotations

import argparse
import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

PROTOCOLO = '2025-06-18'
ENSAIOS = ('SessionFindAll', 'WebhooksList', 'SessionGetStats', 'SettingsGet')


def chamar(url: str, chave: str, corpo: dict) -> dict:
    pedido = urllib.request.Request(
        url,
        data=json.dumps(corpo).encode(),
        headers={'content-type': 'application/json', 'x-api-key': chave},
        method='POST',
    )
    with urllib.request.urlopen(pedido, timeout=15) as resposta:
        return json.loads(resposta.read().decode())


def principal(url: str, chave: str) -> dict:
    inicio = chamar(url, chave, {'jsonrpc': '2.0', 'id': 1, 'method': 'initialize', 'params': {}})
    if 'error' in inicio:
        raise SystemExit(f'initialize recusado: {inicio["error"]}')
    info = inicio['result'].get('serverInfo', {})
    lista = chamar(url, chave, {'jsonrpc': '2.0', 'id': 2, 'method': 'tools/list'})
    ferramentas = [t['name'] for t in lista.get('result', {}).get('tools', [])]
    ensaios = []
    for indice, nome in enumerate(ENSAIOS, start=10):
        resposta = chamar(url, chave, {'jsonrpc': '2.0', 'id': indice, 'method': 'tools/call',
                                       'params': {'name': nome, 'arguments': {}}})
        erro = resposta.get('error', {}).get('message')
        saida = resposta.get('result', {})
        texto = (saida.get('content') or [{}])[0].get('text', '')
        ensaios.append({'ferramenta': nome, 'ok': not erro and not saida.get('isError'),
                        'erro': erro or (None if not saida.get('isError') else texto[:160])})
    return {
        'gate': 'mcp-cliente-externo-v1',
        'servidores': {
            'fio-raiz': {
                'confirmado': bool(info.get('name')) and len(ferramentas) > 0,
                'endpoint': url,
                'transporte': 'http+json',
                'protocolo': inicio['result'].get('protocolVersion', ''),
                'server_info': info,
                'ferramentas': ferramentas,
                'ensaios': ensaios,
                'observado_em': datetime.now(timezone.utc).isoformat(timespec='seconds'),
            }
        },
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--url', default='http://127.0.0.1:2790/mcp')
    p.add_argument('--chave', required=True)
    p.add_argument('--saida', default='mcp/recibo-cliente.json')
    args = p.parse_args()
    recibo = principal(args.url, args.chave)
    servidor = recibo['servidores']['fio-raiz']
    Path(args.saida).parent.mkdir(parents=True, exist_ok=True)
    Path(args.saida).write_text(json.dumps(recibo, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'confirmado': servidor['confirmado'], 'ferramentas': len(servidor['ferramentas']),
                      'ensaios_ok': sum(1 for e in servidor['ensaios'] if e['ok'])}, ensure_ascii=False))
    return 0 if servidor['confirmado'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
