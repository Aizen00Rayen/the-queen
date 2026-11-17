"""Upscale + enhance brand images recovered from the old site.
Usage: python3 tools/process_images.py <src_dir> <out_dir>"""
import sys, os
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

def enhance(im, scale=2, sharp=(2, 120, 2), contrast=1.04, color=1.06):
    rgba = im.mode == 'RGBA'
    im = im.resize((im.width*scale, im.height*scale), Image.LANCZOS)
    if rgba:
        r,g,b,a = im.split(); rgb = Image.merge('RGB',(r,g,b))
    else: rgb = im.convert('RGB')
    rgb = rgb.filter(ImageFilter.UnsharpMask(*sharp))
    rgb = ImageEnhance.Contrast(rgb).enhance(contrast)
    rgb = ImageEnhance.Color(rgb).enhance(color)
    if rgba:
        a = a.filter(ImageFilter.GaussianBlur(0.6)).point(lambda v: max(0,min(255,int((v-128)*1.6+128))))
        rgb = rgb.convert('RGBA'); rgb.putalpha(a)
    return rgb

def save(im, name, q=86):
    im.save(os.path.join(out, name+'.webp'), 'WEBP', quality=q, method=6)
    print(name, im.size)

# Photos
for f,n,s in [('product1.jpg','vitc-scene',2),('product2.jpg','hyal-scene',2),('products.jpg','duo-noir',2)]:
    save(enhance(Image.open(os.path.join(src,f))), n)
for f,n in [('avant_face.jpg','before'),('apres_face.jpg','after')]:
    im = Image.open(os.path.join(src,f)); im = im.crop((0,58,im.width,im.height))
    save(enhance(im, sharp=(1.5,90,2)), n)
# Transparent bottles
for f,n,s in [('vitaminc-bottle-transparent.png','vitc-bottle',3),('hyaluronic-bottle-transparent.png','hyal-bottle',3),('products-duo-transparent.png','duo-bottles',2)]:
    im = Image.open(os.path.join(src,f)).convert('RGBA'); im = im.crop(im.getbbox())
    e = enhance(im, scale=s); save(e, n, q=90); e.save(os.path.join(out,n+'.png'), optimize=True)

# Logo: rebuild crisp large alpha from the 320px dark logo
lg = Image.open(os.path.join(src,'logo-dark.png')).convert('RGBA')
a = lg.split()[3]; a = a.crop(a.getbbox())
S=8
big = a.resize((a.width*S, a.height*S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(S*0.35))
big = big.point(lambda v: max(0,min(255,int((v-118)*5+128))))
big = big.filter(ImageFilter.GaussianBlur(1.1))
pad = 40
canvas = Image.new('L',(big.width+pad*2, big.height+pad*2),0); canvas.paste(big,(pad,pad)); big=canvas
def tint(rgb):
    im = Image.new('RGBA', big.size, rgb+(255,)); im.putalpha(big); return im
def gold():
    w,h = big.size; grad = Image.new('RGB',(w,h))
    stops=[(0,(166,124,62)),(0.35,(231,207,159)),(0.55,(201,166,107)),(0.8,(244,226,186)),(1,(160,118,58))]
    px=grad.load()
    col=[]
    for x in range(w):
        t=x/(w-1)
        for i in range(len(stops)-1):
            if stops[i][0]<=t<=stops[i+1][0]:
                k=(t-stops[i][0])/(stops[i+1][0]-stops[i][0]); c0,c1=stops[i][1],stops[i+1][1]
                col.append(tuple(int(c0[j]+(c1[j]-c0[j])*k) for j in range(3))); break
    row = Image.new('RGB',(w,1)); row.putdata(col); grad=row.resize((w,h))
    im=grad.convert('RGBA'); im.putalpha(big); return im
for n,im in [('logo-black',tint((11,10,9))),('logo-ivory',tint((245,239,230))),('logo-gold',gold())]:
    im.save(os.path.join(out,n+'.png'), optimize=True); print(n, im.size)
