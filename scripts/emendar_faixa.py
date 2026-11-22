#!/usr/bin/env python3
"""Deixa uma faixa de pixel art SEM EMENDA (para o jogo repetir lado a lado).

A ponta final se funde na ponta inicial com uma transição em pixels (mistura "pontilhada" em blocos do tamanho do pixel da arte),
em vez de um degradê suave, para manter o visual de pixel art. A faixa de saída fica N colunas mais curta.

Uso:  python3 scripts/emendar_faixa.py entrada.webp saida.webp [--sobreposicao 128] [--bloco 4]
"""
import sys, argparse
from PIL import Image

BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]   # limiar ordenado 4x4 (0..15)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('entrada'); ap.add_argument('saida')
    ap.add_argument('--sobreposicao', type=int, default=128); ap.add_argument('--bloco', type=int, default=4)
    a = ap.parse_args()
    im = Image.open(a.entrada).convert('RGBA'); W, H = im.size; N, B = a.sobreposicao, a.bloco
    if N >= W // 2: sys.exit('sobreposição grande demais')
    px = im.load(); out = Image.new('RGBA', (W - N, H)); po = out.load()
    for x in range(W - N):
        for y in range(H):
            if x >= N: po[x, y] = px[x, y]; continue
            t = (x + 0.5) / N                                  # 0 = ponta final (continua a faixa) ... 1 = ponta inicial
            limiar = (BAYER[(y // B) % 4][(x // B) % 4] + 0.5) / 16
            po[x, y] = px[x, y] if t >= limiar else px[W - N + x, y]   # t grande = pixel da ponta inicial
    out.save(a.saida, 'WEBP', lossless=True)
    print(f'{a.saida}: {out.size[0]}x{out.size[1]} (era {W}x{H}); transição de {N} colunas em blocos de {B}px')

if __name__ == '__main__': main()
