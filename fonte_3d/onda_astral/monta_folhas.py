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
        if crop:im=crop(im,i)
        f.alpha_composite(im.resize((128,128),Image.LANCZOS),(i%6*128,i//6*128))
    return f
def borda(a,i):
    # borda irregular: o contorno do feixe sobe e desce como chama/raio; ruído periódico na largura (o pedaço repete sem emenda)
    h,w=a.shape[:2];x=np.arange(w)/w*2*np.pi;rng=np.random.default_rng(7)
    ph=rng.uniform(0,6.28,(2,8))
    def onda(lado):
        r=np.zeros(w)
        for k,amp in enumerate([.55,.45,.38,.3,.2,.12,.08,.05,.03,.02]):
            fq=[2,3,5,7,9,11,13,16,19,23][k];r+=amp*np.sin(fq*x+ph[lado,k%8]*(k+1)+i*(.8+.31*k)*(1 if k%2 else -1))
        r=r/1.4
        pico=np.maximum(0,np.sin(6*x+ph[lado,1]*3-i*1.1))**8*1.6+np.maximum(0,np.sin(11*x+ph[lado,2]*5+i*1.7))**10*1.1   # pontas de chama/raio
        return r+pico
    al=a[...,3].astype(float)/255;ys=np.nonzero(al.max(1)>.05)[0]
    cy=(ys.min()+ys.max())/2;meia=(ys.max()-ys.min())/2
    yy=np.arange(h)[:,None]
    for lado,sinal in [(0,-1),(1,1)]:
        lim=meia*np.clip(.66+.48*onda(lado),.3,1.3)[None,:]
        d=(yy-cy)*sinal
        m=np.clip(1-(d-lim)/(meia*.08),0,1);m=np.where(d<0,1,m)
        al=al*m
    a[...,3]=(al*255).astype('uint8');return a
def feixe(im,i=0):
    w,h=im.size;x0=w//3;n=h;k=n//4
    a=np.array(im.crop((x0,0,x0+n,h))).astype(float);b=np.array(im.crop((x0+n,0,x0+n+k,h))).astype(float)
    for x in range(k):t=x/k;a[:,x]=a[:,x]*t+b[:,x]*(1-t)   # emenda: o fim encaixa no começo
    a=borda(a.astype('uint8'),i)
    cel=Image.new('RGBA',(256,256),(0,0,0,0));cel.alpha_composite(Image.fromarray(a,'RGBA').resize((248,224)),(4,32));return cel
dst='/home/user/eudoria/assets/reforged_v10/'
folha('carga').save(dst+'wave3d-charge.webp',lossless=True)
folha('impacto').save(dst+'wave3d-impact.webp',lossless=True)
folha('feixe',feixe).save(dst+'wave3d-beam.webp',lossless=True)
o=Image.new('RGBA',(768,512*3+20),(30,34,70,255))
for i,k in enumerate(['beam','charge','impact']):o.alpha_composite(Image.open(dst+'wave3d-'+k+'.webp'),(0,i*522))
o.save(B+'/prev.png')
print({k:os.path.getsize(dst+'wave3d-'+k+'.webp')//1024 for k in ['beam','charge','impact']})
