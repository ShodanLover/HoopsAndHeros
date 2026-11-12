"""Finishes a cut-out character (RGBA PNG) two ways for comparison:

  hd     premultiplied Lanczos downscale to --height px, soft alpha kept: crisp HD art, no pixel grid
  hibit  the forge's hi-bit pixel finish at --height px (needs agent-sprite-forge installed)

  python tools/sd/finish.py <cutout.png> <outdir> --height 192 [--colors 20] [--outline dark]
Writes <outdir>/hd.png and <outdir>/hibit.png.
"""
import argparse, glob, os, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image


def trim(im):
    a = np.asarray(im)[:, :, 3]
    ys, xs = np.where(a > 0)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def hd(src, dst, height):
    im = trim(Image.open(src).convert('RGBA'))
    a = np.asarray(im).astype(np.float32) / 255.0
    pre = a.copy(); pre[:, :, :3] *= pre[:, :, 3:4]
    k = height / im.height
    size = (max(1, round(im.width * k)), height)
    ch = [Image.fromarray((pre[:, :, i] * 255).astype(np.uint8)).resize(size, Image.LANCZOS) for i in range(4)]
    out = np.dstack([np.asarray(c).astype(np.float32) / 255.0 for c in ch])
    al = out[:, :, 3:4]
    rgb = np.where(al > 0.002, out[:, :, :3] / np.maximum(al, 0.002), 0)
    res = np.dstack([np.clip(rgb, 0, 1), np.clip(al, 0, 1)])
    Image.fromarray((res * 255).astype(np.uint8), 'RGBA').save(dst)


def pix(src, dst, height, colors=32, outline=(12, 10, 24)):
    """Averaging pixel finish: premultiplied Lanczos downscale (keeps small dark features such as eyes),
    median-cut palette with no dither, binary alpha, 1 px outline on the 4-neighbour ring."""
    im = trim(Image.open(src).convert('RGBA'))
    a = np.asarray(im).astype(np.float32) / 255.0
    pre = a.copy(); pre[:, :, :3] *= pre[:, :, 3:4]
    k = (height - 2) / im.height
    size = (max(1, round(im.width * k)), height - 2)
    ch = [Image.fromarray((pre[:, :, i] * 255).astype(np.uint8)).resize(size, Image.LANCZOS) for i in range(4)]
    out = np.dstack([np.asarray(c).astype(np.float32) / 255.0 for c in ch])
    al = out[:, :, 3]
    solid = al >= 0.5
    rgb = np.where(al[:, :, None] > 0.002, out[:, :, :3] / np.maximum(al[:, :, None], 0.002), 0)
    rgb8 = (np.clip(rgb, 0, 1) * 255).astype(np.uint8)
    # palette from the solid pixels only, snapped with no dither
    flat = Image.fromarray(rgb8[solid].reshape(1, -1, 3), 'RGB').quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = np.array(flat.getpalette()[:colors * 3]).reshape(-1, 3)
    idx = np.asarray(flat).reshape(-1)
    q = np.zeros_like(rgb8); q[solid] = pal[idx]
    # pad 1 px for the outline
    H, W = solid.shape
    canvas = np.zeros((H + 2, W + 2, 4), np.uint8)
    canvas[1:-1, 1:-1, :3] = q; canvas[1:-1, 1:-1, 3] = solid * 255
    m = canvas[:, :, 3] > 0
    ring = np.zeros_like(m)
    ring[1:, :] |= m[:-1, :]; ring[:-1, :] |= m[1:, :]; ring[:, 1:] |= m[:, :-1]; ring[:, :-1] |= m[:, 1:]
    ring &= ~m
    canvas[ring, :3] = outline; canvas[ring, 3] = 255
    Image.fromarray(canvas, 'RGBA').save(dst)


def forge_dir():
    env = os.environ.get('SPRITE_FORGE')
    if env:
        return env
    found = sorted(glob.glob(os.path.join(os.path.expanduser('~'), '.claude', 'plugins', 'cache', 'agent-sprite-forge', 'agent-sprite-forge', '*')))
    return found[-1] if found else None


def hibit(src, dst, height, colors, outline):
    forge = forge_dir()
    if not forge:
        print('hibit skipped: agent-sprite-forge not found'); return
    tool = os.path.join(forge, 'skills', 'video2dsprite', 'scripts', 'finish_frames.py')
    tmp = tempfile.mkdtemp(prefix='hb')
    fin, fout = os.path.join(tmp, 'in'), os.path.join(tmp, 'out')
    os.makedirs(fin); shutil.copy(src, os.path.join(fin, 'frame_000.png'))
    env = dict(os.environ, PYTHONUTF8='1')
    r = subprocess.run([sys.executable, tool, 'hibit', '--frames', fin, '--output-dir', fout, '--target-height', str(height),
                        '--colors', str(colors), '--outline', outline], env=env, capture_output=True, text=True)
    if r.returncode != 0:
        print('hibit failed:', (r.stdout + r.stderr)[-800:]); return
    shutil.copy(os.path.join(fout, 'frames', 'frame_000.png'), dst)
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--height', type=int, default=192)
    ap.add_argument('--colors', type=int, default=20)
    ap.add_argument('--outline', default='dark')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    hd(a.src, os.path.join(a.out, 'hd.png'), a.height)
    pix(a.src, os.path.join(a.out, 'pix.png'), a.height, a.colors)
    hibit(a.src, os.path.join(a.out, 'hibit.png'), a.height, a.colors, a.outline)
    print('finished', a.out)
