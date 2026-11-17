"""Composite the real (AI-restored) product cut-outs onto the AI-generated scenes.
Run: python3 tools/compose.py   (expects tools/work/cut-*.png and scene-*.jpg)
Outputs WebP files into client/public/brand/v2/.
"""
import os
from PIL import Image, ImageFilter, ImageEnhance, ImageChops, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.join(HERE, 'work')
OUT = os.path.join(HERE, '..', 'client', 'public', 'brand', 'v2')
os.makedirs(OUT, exist_ok=True)

cut = {n: Image.open(os.path.join(W, f'cut-{n}.png')).convert('RGBA') for n in ('vitc', 'hyal', 'duo')}
scene = {n: Image.open(os.path.join(W, f'scene-{n}.jpg')).convert('RGB') for n in ('hero', 'gold', 'azure')}


def amber_grade(im):
    """Re-grade the ivory/gold scene into a warm apricot 'morning sun' world for Vitamin C."""
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.04 + 6)))
    g = g.point(lambda v: int(v * 0.80))
    b = b.point(lambda v: int(v * 0.52))
    out = Image.merge('RGB', (r, g, b))
    out = ImageEnhance.Contrast(out).enhance(1.06)
    # warm sun glow from the top-right
    glow = Image.new('L', out.size, 0)
    d = ImageDraw.Draw(glow)
    w, h = out.size
    d.ellipse((w * 0.45, -h * 0.25, w * 1.35, h * 0.55), fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(w * 0.12))
    out = Image.composite(Image.new('RGB', out.size, (255, 196, 120)), out, glow.point(lambda v: int(v * 0.45)))
    return out


def rose_grade(im):
    """Re-grade the ivory/gold scene into a blush-rose world for the Damask rose water panel."""
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.0 + 4)))
    g = g.point(lambda v: int(v * 0.76))
    b = b.point(lambda v: int(v * 0.78))
    out = ImageEnhance.Contrast(Image.merge('RGB', (r, g, b))).enhance(1.05)
    glow = Image.new('L', out.size, 0)
    w, h = out.size
    ImageDraw.Draw(glow).ellipse((-w * 0.3, -h * 0.2, w * 0.7, h * 0.5), fill=140)
    glow = glow.filter(ImageFilter.GaussianBlur(w * 0.12))
    return Image.composite(Image.new('RGB', out.size, (255, 200, 205)), out, glow.point(lambda v: int(v * 0.4)))


def tint(prod, color, amount):
    """Wrap the product in the scene's light colour so it doesn't look pasted."""
    rgb = prod.convert('RGB')
    overlay = Image.new('RGB', prod.size, color)
    mixed = Image.blend(rgb, ImageChops.multiply(rgb, overlay), amount)
    mixed = mixed.convert('RGBA'); mixed.putalpha(prod.getchannel('A'))
    return mixed


def place(bg, prod, cx, base_y, height, *, light=(255, 240, 220), tint_amt=0.12, reflect=0.0, shadow=0.55, cast_dx=0.0):
    bg = bg.convert('RGBA')
    Wb, Hb = bg.size
    hpx = int(Hb * height)
    p = prod.resize((int(prod.width * hpx / prod.height), hpx), Image.LANCZOS)
    p = tint(p, light, tint_amt)
    x = int(Wb * cx - p.width / 2)
    y = int(Hb * base_y - p.height)

    # 1) soft ambient occlusion under the base
    sh = Image.new('L', bg.size, 0)
    d = ImageDraw.Draw(sh)
    ew, eh = p.width * 0.62, p.width * 0.07
    d.ellipse((Wb * cx - ew, Hb * base_y - eh, Wb * cx + ew, Hb * base_y + eh), fill=int(255 * shadow))
    sh = sh.filter(ImageFilter.GaussianBlur(p.width * 0.05))
    bg = Image.composite(Image.new('RGBA', bg.size, (0, 0, 0, 255)), bg, sh)

    # 2) long soft cast shadow (skewed silhouette) away from the light
    if cast_dx:
        a = p.getchannel('A').resize((p.width, int(p.height * 0.35)))
        cast = Image.new('L', bg.size, 0)
        sil = a.transform(a.size, Image.AFFINE, (1, cast_dx, -cast_dx * a.height, 0, 1, 0), resample=Image.BICUBIC)
        cast.paste(sil.point(lambda v: int(v * 0.35)), (x, int(Hb * base_y - a.height * 0.15)))
        cast = cast.filter(ImageFilter.GaussianBlur(p.width * 0.06))
        bg = Image.composite(Image.new('RGBA', bg.size, (0, 0, 0, 255)), bg, cast)

    # 3) mirror reflection on glossy surfaces
    if reflect:
        ref = p.transpose(Image.FLIP_TOP_BOTTOM)
        ref = ref.crop((0, 0, ref.width, int(ref.height * 0.10)))  # short: only the base reflects on a shallow top
        fade = Image.linear_gradient('L').resize(ref.size).point(lambda v: int(((255 - v) / 255) ** 2 * 255 * reflect))
        ra = ImageChops.multiply(ref.getchannel('A'), fade)
        ref.putalpha(ra)
        ref = ref.filter(ImageFilter.GaussianBlur(2))
        bg.alpha_composite(ref, (x, int(Hb * base_y) - 2))

    bg.alpha_composite(p, (x, y))
    return bg.convert('RGB')


def finish(im, name, max_w=None, q=86):
    if max_w and im.width > max_w:
        im = im.resize((max_w, int(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=q, method=6)
    print(name, im.size)


amber = amber_grade(scene['gold'])

# Hero: duo on the black marble plinth, gold light
hero = place(scene['hero'], cut['duo'], cx=0.63, base_y=0.66, height=0.50, light=(255, 222, 170), tint_amt=0.16, reflect=0.30, shadow=0.75)
finish(hero, 'hero-duo', 2560)
finish(scene['hero'], 'hero-empty', 2560)

# Product scenes (4:5)
finish(place(amber, cut['vitc'], cx=0.515, base_y=0.535, height=0.40, light=(255, 205, 150), tint_amt=0.12, reflect=0.22, shadow=0.5, cast_dx=-0.5), 'vitc-stage', 1600)
finish(place(scene['azure'], cut['hyal'], cx=0.50, base_y=0.575, height=0.40, light=(190, 220, 255), tint_amt=0.14, reflect=0.0, shadow=0.55), 'hyal-stage', 1600)
finish(place(scene['gold'], cut['duo'], cx=0.515, base_y=0.535, height=0.36, light=(255, 236, 205), tint_amt=0.08, reflect=0.25, shadow=0.45, cast_dx=-0.4), 'duo-stage', 1600)
finish(amber, 'amber-empty', 1600)
finish(place(rose_grade(scene['gold']), cut['duo'], cx=0.515, base_y=0.535, height=0.36, light=(255, 215, 215), tint_amt=0.10, reflect=0.25, shadow=0.45, cast_dx=-0.4), 'rose-stage', 1600)

# Clean cut-outs for cards / hover / ritual
for n in ('vitc', 'hyal', 'duo'):
    c = cut[n]
    if c.height > 1800:
        c = c.resize((int(c.width * 1800 / c.height), 1800), Image.LANCZOS)
    c.save(os.path.join(OUT, f'{n}-cut.webp'), 'WEBP', quality=90, method=6)
    print(f'{n}-cut', c.size)
