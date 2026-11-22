# Guia para usar o Blender no Eldoria

Este arquivo é para a sessão do Claude que roda **no computador** (onde a extensão do Blender funciona). Leia antes de criar qualquer imagem.

## O que o jogo precisa (formatos)
- O jogo é **2D** no navegador: tudo entra como imagem **WebP sem perdas** em `assets/…`. O Blender serve para **renderizar** imagens consistentes (poses, efeitos, objetos), não para o jogo rodar 3D.
- **Efeitos animados de luz** (`assets/efeitos_v39/anim/*.webp`): folha **3×3 de 768×768** (quadros de **256×256**), **fundo preto**. O jogo SOMA a luz (preto = transparente). Toca uma vez ou em loop a 12 quadros/s. Veja `assets/efeitos_v39/README.md` e `js/efeitos_v39.js` (`FX39.draw`).
- **Objetos e ícones** (não são luz): WebP com **transparência** (RGBA), ícones **256×256**.
- **Corpos dos campeões** (ex.: `assets/solar_v29/body.webp`, 1254×1254 RGBA): folha de poses; o recorte é feito pelo código de cada herói (ex.: `solar29Cell` em `js/solar_v29.js`). **Não troque a arte de um campeão sem ler esse código**: as posições dos quadros precisam continuar iguais.
- Cenários: ~1536×1024, sem transparência (`background.webp`); a arena é desenhada em camadas.

## Fluxo para efeitos (o mais seguro para começar)
1. No Blender, monte o efeito (partículas, anel, explosão, fogo, raio…) com fundo **transparente** e brilho forte (emissão), câmera ortográfica quadrada.
2. Renderize a animação em **PNG** (ex.: 24 a 36 quadros, 512×512 ou mais) numa pasta, com nomes `frame_0001.png`, `frame_0002.png`…
3. Monte a folha do jogo com a ferramenta pronta:
   ```bash
   python3 scripts/montar_folha.py PASTA_DOS_QUADROS assets/efeitos_v39/anim/NOME.webp
   ```
   (escolhe 9 quadros espalhados, achata sobre preto e salva em WebP sem perdas. Para objetos com transparência use `--transparente`.)
4. Registre o efeito em `js/efeitos_v39.js` seguindo os 13 que já existem e confira no jogo: abrir `index.html` por um servidor local (`python3 -m http.server 8000`) e testar a habilidade.
5. **Teste antes de publicar**: `node tests/<teste>.cjs` dos campeões afetados. Nunca apague uma imagem que o código ainda usa.

## Regras do projeto
- Responda em **português**. Mostre o resultado (captura) antes de dizer que ficou bom.
- Arte nova convive com a antiga: o jogo volta ao desenho por código se a imagem não carregar. Não remova o desenho antigo sem pedir.
- Cuidado com o tamanho: as imagens são baixadas no celular dos jogadores. Mire em **no máximo ~500 KB por folha**; se passar, reduza o tamanho antes.
- Fluxo de publicação: `git add`, `git commit` e abrir um PR para a branch **`entrega-v3`** (o site se atualiza sozinho a partir dela). Rode `git fetch origin entrega-v3 && git merge origin/entrega-v3` antes de enviar, porque outras artes entram na mesma branch.

## Conferir antes de enviar
`python3 scripts/validar_folha.py ARQUIVO.webp` confere tamanho, transparência, quadros vazios, margens, laço e peso (folha de quadros). Para faixa que se repete (rastro no chão): `--faixa`. Rode e corrija até aparecer `RESULTADO: OK`.
