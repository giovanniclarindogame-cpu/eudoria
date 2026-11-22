#!/usr/bin/env python3
"""Prévia do rastro de fogo COMO O JOGO DESENHA: a faixa repetida, em pé sobre o chão de pedra, somando luz (modo aditivo, como "lighter" do canvas).

Uso:  python3 scripts/previa_rastro.py rastro_novo.webp previa.png [--escala 1.7] [--comparar assets/efeitos_v39/rastroFogo_antigo.webp]
Gera uma imagem com a faixa repetida 3 vezes sobre o chão; com --comparar, põe o rastro antigo em cima e o novo embaixo.
"""
import sys, argparse
from PIL import Image

CHAO = (74, 88, 112)   # cor média do piso da arena (azul-acinzentado)

def desenha(caminho, escala, largura=1200):
    im = Image.open(caminho).convert('RGBA'); W, H = im.size
    esp = int(round(30 * escala)); tw = int(round(esp * W / H))   # o jogo usa espessura = TRAIL_W*1.7 e largura proporcional
    im = im.resize((tw, esp), Image.NEAREST)
    base = Image.new('RGB', (largura, esp + 60), CHAO)
    px = base.load(); fx = Image.new('RGBA', (largura, esp + 60), (0, 0, 0, 0))
    x = 0
    while x < largura: fx.alpha_composite(im, (x, 30)) if x + tw <= largura else fx.alpha_composite(im.crop((0, 0, largura - x, esp)), (x, 30)); x += tw
    fp = fx.load()
    for yy in range(fx.size[1]):
        for xx in range(largura):
            r, g, b, a = fp[xx, yy]
            if a:   # soma luz: cor * alfa somada ao chão
                c = px[xx, yy]; px[xx, yy] = (min(255, c[0] + r * a // 255), min(255, c[1] + g * a // 255), min(255, c[2] + b * a // 255))
    return base

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('arquivo'); ap.add_argument('saida'); ap.add_argument('--escala', type=float, default=1.7); ap.add_argument('--comparar')
    a = ap.parse_args(); novo = desenha(a.arquivo, a.escala)
    if a.comparar:
        velho = desenha(a.comparar, a.escala); out = Image.new('RGB', (novo.size[0], velho.size[1] + novo.size[1] + 10), (20, 20, 30))
        out.paste(velho, (0, 0)); out.paste(novo, (0, velho.size[1] + 10)); out.save(a.saida)
    else: novo.save(a.saida)
    print(f'{a.saida}: prévia gravada (escala {a.escala})')

if __name__ == '__main__': main()
