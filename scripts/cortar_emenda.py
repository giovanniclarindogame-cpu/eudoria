#!/usr/bin/env python3
"""Acha o melhor corte de uma faixa de pixel art para repetir SEM emenda: procura dois pontos onde a faixa é igual (ou quase) e recorta entre eles.
Uso:  python3 scripts/cortar_emenda.py entrada.webp saida.webp [--minimo 900] [--bloco 4]
Se o melhor corte ainda tiver diferença alta, use scripts/emendar_faixa.py (mistura em pixels)."""
import sys, argparse
from PIL import Image
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('entrada'); ap.add_argument('saida'); ap.add_argument('--minimo', type=int, default=900); ap.add_argument('--bloco', type=int, default=4)
    a = ap.parse_args(); im = Image.open(a.entrada).convert('RGBA'); W, H = im.size; px = im.load(); B = a.bloco
    col = {x: [px[x, y] for y in range(0, H, B)] for x in range(0, W, B)}
    def dif(c1, c2): return sum(abs(p[0]-q[0]) + abs(p[1]-q[1]) + abs(p[2]-q[2]) + abs(p[3]-q[3]) for p, q in zip(c1, c2)) / len(c1)
    melhor = None
    for i in range(B, W - a.minimo, B):
        for f in range(i + a.minimo, W + 1, B):
            d = dif(col[f - B], col[i - B])
            if melhor is None or d < melhor[0] or (d == melhor[0] and f - i > melhor[2] - melhor[1]): melhor = (d, i, f)
    d, i, f = melhor; im.crop((i, 0, f, H)).save(a.saida, 'WEBP', lossless=True)
    print(f'{a.saida}: corte {i}-{f} ({f - i}x{H}), diferença na emenda = {d:.1f}' + ('  (perfeito)' if d == 0 else '  (use emendar_faixa.py se ainda aparecer)'))
if __name__ == '__main__': main()
