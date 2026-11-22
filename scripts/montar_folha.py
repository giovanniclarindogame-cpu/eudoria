#!/usr/bin/env python3
"""Monta uma folha de efeito animado no formato do jogo a partir de quadros PNG (por exemplo, renderizados no Blender).

Formato (igual a assets/efeitos_v39/anim): folha 3 x 3 de 768 x 768 px, quadros de 256 x 256, fundo PRETO (o jogo soma a luz: preto = transparente),
WebP sem perdas. Se houver mais de 9 quadros, escolhe 9 espalhados; se houver menos, repete o último.

Uso:  python3 scripts/montar_folha.py PASTA_DOS_QUADROS saida.webp [--colunas 3] [--celula 256] [--transparente]
  --transparente  mantém o canal alfa (para objetos/ícones que NÃO são luz); sem isso, achata sobre preto (efeitos de luz).
Os quadros são lidos em ordem alfabética (frame_0001.png, frame_0002.png ...).
"""
import sys, glob, os, argparse
from PIL import Image

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pasta'); ap.add_argument('saida')
    ap.add_argument('--colunas', type=int, default=3); ap.add_argument('--celula', type=int, default=256)
    ap.add_argument('--transparente', action='store_true')
    a = ap.parse_args()
    arqs = sorted(glob.glob(os.path.join(a.pasta, '*.png')))
    if not arqs: sys.exit('Nenhum PNG em ' + a.pasta)
    n = a.colunas * a.colunas
    if len(arqs) > n:   # escolhe n quadros espalhados do começo ao fim
        arqs = [arqs[round(i * (len(arqs) - 1) / (n - 1))] for i in range(n)]
    while len(arqs) < n: arqs.append(arqs[-1])
    modo = 'RGBA' if a.transparente else 'RGB'
    folha = Image.new(modo, (a.colunas * a.celula,) * 2, (0, 0, 0, 0) if a.transparente else (0, 0, 0))
    for i, f in enumerate(arqs):
        q = Image.open(f).convert('RGBA').resize((a.celula, a.celula), Image.LANCZOS)
        if not a.transparente:
            fundo = Image.new('RGBA', q.size, (0, 0, 0, 255)); fundo.alpha_composite(q); q = fundo.convert('RGB')
        folha.paste(q, ((i % a.colunas) * a.celula, (i // a.colunas) * a.celula))
    folha.save(a.saida, 'WEBP', lossless=True)
    print(f'{a.saida}: {folha.size[0]}x{folha.size[1]}, {n} quadros de {a.celula}px, {"com alfa" if a.transparente else "fundo preto"}')

if __name__ == '__main__': main()
