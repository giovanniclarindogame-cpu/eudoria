#!/usr/bin/env python3
"""Confere uma folha de efeito do Eldoria antes de enviar (formato, quadros vazios, margens, laço e peso).

Uso:  python3 scripts/validar_folha.py ARQUIVO.webp [--colunas 6] [--linhas 4] [--celula 256] [--laco 8-15] [--max-kb 1000]
Faixa que se repete (rastro no chão):  python3 scripts/validar_folha.py rastro_novo.webp --faixa
Para a folha do dash do Guardião Solar:  python3 scripts/validar_folha.py dash_novo.webp --colunas 6 --linhas 4 --celula 256 --laco 8-15
"""
import sys, os, argparse
from PIL import Image, ImageChops

def faixa(im, a):
    W, H = im.size; erros, avisos = [], []
    print(f'{a.arquivo}: {W}x{H} {im.mode}, {os.path.getsize(a.arquivo)//1024} KB (faixa que se repete)')
    if im.mode != 'RGBA': erros.append(f'precisa ser RGBA com fundo transparente (tem {im.mode})')
    if not (800 <= W <= 3000 and 64 <= H <= 256): erros.append(f'tamanho fora do esperado: largura 800 a 3000 e altura 64 a 256 (o atual tem 1348x129); tem {W}x{H}')
    if W / max(1, H) < 6: avisos.append('a faixa deveria ser bem mais larga que alta (proporção de uns 10:1)')
    if os.path.getsize(a.arquivo) > a.max_kb * 1024: erros.append(f'pesado demais (máximo {a.max_kb} KB)')
    if erros:
        for e in erros: print('ERRO:', e)
        sys.exit(1)
    im = im.convert('RGBA'); alfa = im.getchannel('A')
    caixa = alfa.point(lambda v: 255 if v > 24 else 0).getbbox()
    if caixa is None: print('ERRO: a imagem está vazia'); sys.exit(1)
    # emenda: a última coluna precisa "continuar" na primeira
    def coluna(x): return im.crop((x, 0, x + 1, H))
    def dif(c1, c2): return sum(ImageChops.difference(c1.convert('RGB'), c2.convert('RGB')).convert('L').tobytes()) / H
    emenda = dif(coluna(W - 1), coluna(0)); vizinhas = sum(dif(coluna(x), coluna(x + 1)) for x in range(0, W - 1, max(1, W // 80))) / len(range(0, W - 1, max(1, W // 80)))
    print(f'emenda: diferença entre a última e a primeira coluna = {emenda:.1f} (entre colunas vizinhas = {vizinhas:.1f})')
    if emenda > vizinhas * 2.5 + 8: avisos.append('a emenda aparece: a última coluna tem que parecer a continuação da primeira (use o recurso de repetir no Blender ou espelhe a transição)')
    base = alfa.crop((0, int(H * 0.82), W, H)).point(lambda v: 255 if v > 24 else 0).getbbox()
    if base is None: avisos.append('as chamas deveriam nascer da parte de baixo da imagem (o jogo as desenha de pé sobre o chão)')
    topo = alfa.crop((0, 0, W, 2)).point(lambda v: 255 if v > 24 else 0).getbbox()
    if topo: avisos.append('há chama encostando no topo da imagem: ela será cortada; deixe uma folga em cima')
    for e in erros: print('ERRO:', e)
    for v in avisos: print('aviso:', v)
    print('RESULTADO:', 'FALHOU' if erros else ('OK com avisos' if avisos else 'OK'))
    sys.exit(1 if erros else 0)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('arquivo'); ap.add_argument('--colunas', type=int, default=6); ap.add_argument('--linhas', type=int, default=4)
    ap.add_argument('--celula', type=int, default=256); ap.add_argument('--laco', default='8-15'); ap.add_argument('--max-kb', type=int, default=1000); ap.add_argument('--faixa', action='store_true', help='faixa horizontal que se repete sem emenda (rastro de fogo no chão)')
    a = ap.parse_args()
    erros, avisos = [], []
    im = Image.open(a.arquivo); W, H = im.size
    if a.faixa: return faixa(im, a)
    esperado = (a.colunas * a.celula, a.linhas * a.celula)
    print(f'{a.arquivo}: {W}x{H} {im.mode}, {os.path.getsize(a.arquivo)//1024} KB')
    if (W, H) != esperado: erros.append(f'tamanho deve ser {esperado[0]}x{esperado[1]} (tem {W}x{H})')
    if im.mode != 'RGBA': erros.append(f'precisa ser RGBA com fundo transparente (tem {im.mode})')
    if os.path.getsize(a.arquivo) > a.max_kb * 1024: erros.append(f'pesado demais: {os.path.getsize(a.arquivo)//1024} KB (máximo {a.max_kb} KB)')
    if erros:
        for e in erros: print('ERRO:', e)
        sys.exit(1)
    im = im.convert('RGBA'); n = a.colunas * a.linhas; c = a.celula; seguro = c * 0.125   # o jogo esmaece 12,5% de cada borda
    quadros, tam = [], []
    for i in range(n):
        q = im.crop(((i % a.colunas) * c, (i // a.colunas) * c, (i % a.colunas) * c + c, (i // a.colunas) * c + c))
        alfa = q.getchannel('A'); caixa = alfa.point(lambda v: 255 if v > 24 else 0).getbbox()
        quadros.append(q)
        if caixa is None:
            tam.append(0); 
            if 6 <= i <= 17: erros.append(f'quadro {i+1} está vazio (deveria ter o efeito)')
            continue
        tam.append((caixa[2] - caixa[0]) * (caixa[3] - caixa[1]))
        if caixa[0] < seguro or caixa[1] < seguro or caixa[2] > c - seguro or caixa[3] > c - seguro:
            avisos.append(f'quadro {i+1}: o efeito chega perto da borda ({caixa}); o jogo esmaece os 12,5% de cada lado e vai cortar')
    # fundo: o canto precisa ser realmente transparente
    for i in (0, a.colunas - 1, n - 1):
        if quadros[i].getpixel((2, 2))[3] > 8: erros.append(f'quadro {i+1}: o canto não é transparente (fundo sólido? o jogo precisa de transparência)')
    # laço: o último quadro do trecho do voo precisa parecer com o primeiro
    try:
        l0, l1 = [int(x) - 1 for x in a.laco.split('-')]
        def dif(x, y): return sum(ImageChops.difference(quadros[x].convert('RGB'), quadros[y].convert('RGB')).convert('L').resize((32, 32)).getdata()) / 1024
        salto = dif(l1, l0); vizinho = sum(dif(i, i + 1) for i in range(l0, l1)) / max(1, l1 - l0)
        print(f'laço {l0+1}-{l1+1}: diferença entre o último e o primeiro = {salto:.1f} (entre quadros vizinhos = {vizinho:.1f})')
        if salto > vizinho * 2.2 + 3: avisos.append(f'o laço dá um "pulo" ao voltar do quadro {l1+1} para o {l0+1}; deixe o último parecido com o primeiro')
    except Exception: pass
    cresce = [t for t in tam[:8]]
    if cresce and cresce[0] > max(cresce) * .8: avisos.append('os primeiros quadros deveriam começar pequenos (o efeito nasce e cresce)')
    if tam[-1] > max(tam) * .35: avisos.append('o último quadro deveria quase sumir (o efeito se dissipa)')
    for e in erros: print('ERRO:', e)
    for v in avisos: print('aviso:', v)
    print('RESULTADO:', 'FALHOU' if erros else ('OK com avisos' if avisos else 'OK'))
    sys.exit(1 if erros else 0)

if __name__ == '__main__': main()
