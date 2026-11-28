from PIL import Image,ImageFilter,ImageChops
import numpy as np,os
B='/tmp/claude-0/onda'
def rgba(im):
    im=im.convert('RGB');bl=im.filter(ImageFilter.GaussianBlur(8));im=ImageChops.add(im,bl.point(lambda v:int(v*.6)))
    a=np.array(im).astype(float)/255;al=np.clip(a.max(2)*1.1,0,1)
    rgb=np.where(al[...,None]>0,a/np.maximum(al[...,None],1e-6),0)
    return Image.fromarray(np.dstack([np.clip(rgb,0,1)*255,al*255]).astype('uint8'),'RGBA')
def folha(q,crop=None):
    f=Image.new('RGBA',(768,512),(0,0,0,0))
    for i,n in enumerate(sorted(os.listdir(f'{B}/{q}'))[:24]):
        im=rgba(Image.open(f'{B}/{q}/{n}'))
        if crop:im=crop(im)
        f.alpha_composite(im.resize((128,128),Image.LANCZOS),(i%6*128,i//6*128))
    return f
def feixe(im):
    w,h=im.size;x0=w//3;n=h;k=n//4
    a=np.array(im.crop((x0,0,x0+n,h))).astype(float);b=np.array(im.crop((x0+n,0,x0+n+k,h))).astype(float)
    for x in range(k):t=x/k;a[:,x]=a[:,x]*t+b[:,x]*(1-t)   # emenda: o fim encaixa no começo
    cel=Image.new('RGBA',(256,256),(0,0,0,0));cel.alpha_composite(Image.fromarray(a.astype('uint8'),'RGBA').resize((248,224)),(4,32));return cel
dst='/home/user/eudoria/assets/reforged_v10/'
folha('carga').save(dst+'wave3d-charge.webp',lossless=True)
folha('impacto').save(dst+'wave3d-impact.webp',lossless=True)
folha('feixe',feixe).save(dst+'wave3d-beam.webp',lossless=True)
o=Image.new('RGBA',(768,512*3+20),(30,34,70,255))
for i,k in enumerate(['beam','charge','impact']):o.alpha_composite(Image.open(dst+'wave3d-'+k+'.webp'),(0,i*522))
o.save(B+'/prev.png')
print({k:os.path.getsize(dst+'wave3d-'+k+'.webp')//1024 for k in ['beam','charge','impact']})
