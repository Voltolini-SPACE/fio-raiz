#!/usr/bin/env python3
"""Compara os arquivos deste repositório com o manifesto sha256 do alvo.

Uso: python3 scripts/conferir-hashes.py [--manifesto ../voltolini-fabrica-de-replicas/referencias/openwa-sha256.txt]
Sai 0 quando nenhum hash coincide; 1 quando há colisão (lista os caminhos).
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
IGNORAR = {'node_modules', 'data', '.git', 'dist'}


def hashes_do_repo() -> dict[str, list[str]]:
    mapa: dict[str, list[str]] = {}
    for arquivo in RAIZ.rglob('*'):
        if not arquivo.is_file() or arquivo.is_symlink():
            continue
        if any(parte in IGNORAR for parte in arquivo.relative_to(RAIZ).parts):
            continue
        mapa.setdefault(hashlib.sha256(arquivo.read_bytes()).hexdigest(), []).append(
            str(arquivo.relative_to(RAIZ)))
    return mapa


def ler_manifesto(caminho: Path) -> set[str]:
    if not caminho.is_file():
        raise SystemExit('comparação NÃO VERIFICADA (manifesto ausente): ' + str(caminho) + '\n'
                         'rode dentro da Fábrica, onde referencias/openwa-sha256.txt existe')
    return {linha.split()[0] for linha in caminho.read_text(encoding='utf-8').splitlines() if linha.strip()}


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--manifesto', default=str(RAIZ.parent / 'voltolini-fabrica-de-replicas' /
                                              'referencias' / 'openwa-sha256.txt'))
    args = p.parse_args()
    proibidos = ler_manifesto(Path(args.manifesto))
    nossos = hashes_do_repo()
    colisoes = [(h, nossos[h]) for h in proibidos if h in nossos]
    print(f'arquivos nossos: {sum(len(v) for v in nossos.values())}')
    print(f'hashes do alvo: {len(proibidos)}')
    print(f'colisoes: {len(colisoes)}')
    for h, caminhos in colisoes[:20]:
        print(f'  {h[:16]} {caminhos}')
    return 1 if colisoes else 0


if __name__ == '__main__':
    raise SystemExit(main())
