"""Render a seamless 8s hero loop from the composited hero still: slow breathing push-in
plus a golden light sweep that only catches highlights. Encodes MP4 (H.264) + WebM.
Run: python3 tools/hero_loop.py <frames_dir>"""
import math, os, subprocess, sys
from PIL import Image, ImageChops, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'client', 'public', 'brand', 'v2', 'hero-duo.webp')
OUT = os.path.join(ROOT, 'client', 'public', 'brand', 'v2')
FR = sys.argv[1]
os.makedirs(FR, exist_ok=True)

W, H, FPS, SEC = 1920, 1080, 30, 8
N = FPS * SEC
src = Image.open(SRC).convert('RGB')
base = src.resize((int(src.width * (H * 1.12) / src.height), int(H * 1.12)), Image.LANCZOS)  # headroom for zoom
lum = base.convert('L').point(lambda v: max(0, v - 70) * 2)  # highlight mask
gold = Image.new('RGB', base.size, (255, 214, 150))

for i in range(N):
    t = i / N
    z = 1.0 + 0.045 * (1 - math.cos(2 * math.pi * t)) / 2          # breathe in & out -> seamless
    cw, ch = int(W * 1.12 / z / 1.12 * (base.height / (H * 1.12)) * 1.0), 0
    cw = int(base.width / (z * 1.12) * (W / (base.width / 1.12 * H * 1.12 / base.height)) ) if False else int(W * base.height / (H * 1.12) / z)
    ch = int(cw * H / W)
    cx = base.width * (0.5 + 0.012 * math.sin(2 * math.pi * t))
    cy = base.height * 0.5
    box = (int(cx - cw / 2), int(cy - ch / 2), int(cx + cw / 2), int(cy + ch / 2))
    frame = base.crop(box)
    m = lum.crop(box)
    # light sweep: diagonal band crossing between t=0.2 and t=0.7, fully off-frame otherwise
    u = (t - 0.2) / 0.5
    if 0 <= u <= 1:
        band = Image.linear_gradient('L').rotate(-70, expand=True).resize((frame.width * 3, frame.height * 3))
        off = int((-0.9 + 1.8 * u) * frame.width)
        band = band.crop((frame.width - off, frame.height, 2 * frame.width - off, 2 * frame.height))
        band = band.point(lambda v: int(max(0, 1 - abs(v - 128) / 22) * 200))
        band = band.filter(ImageFilter.GaussianBlur(18))
        mask = ImageChops.multiply(band, m)
        frame = Image.composite(ImageChops.screen(frame, gold.crop(box)), frame, mask)
    frame.resize((W, H), Image.LANCZOS).save(os.path.join(FR, f'f{i:04d}.jpg'), quality=92)

common = ['-y', '-framerate', str(FPS), '-i', os.path.join(FR, 'f%04d.jpg')]
subprocess.run(['ffmpeg', *common, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', '-an', os.path.join(OUT, 'hero-loop.mp4')], check=True, capture_output=True)
subprocess.run(['ffmpeg', *common, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-an', os.path.join(OUT, 'hero-loop.webm')], check=True, capture_output=True)
for f in ('hero-loop.mp4', 'hero-loop.webm'):
    print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, 'KB')
