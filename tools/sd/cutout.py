"""Cuts a character out of its background with the anime-seg ISNet model (SkyTNT, Apache-2.0).

Runs on the CPU with onnxruntime. Use the D:\\AI\\venv interpreter, which has onnxruntime installed:
  D:/AI/venv/Scripts/python.exe tools/sd/cutout.py <in.png> <out.png> [--model D:/AI/models/isnetis.onnx]
Writes an RGBA PNG with binary-ish alpha, ready for the forge hibit finish.
"""
import argparse, os
import numpy as np
import onnxruntime as ort
from PIL import Image

S = 1024
_sessions = {}


def mask(img, model):
    if model not in _sessions:
        _sessions[model] = ort.InferenceSession(model, providers=['CPUExecutionProvider'])
    sess = _sessions[model]
    rgb = np.asarray(img.convert('RGB'), dtype=np.float32) / 255.0
    h, w = rgb.shape[:2]
    k = S / max(h, w)
    nh, nw = int(round(h * k)), int(round(w * k))
    small = np.asarray(Image.fromarray((rgb * 255).astype(np.uint8)).resize((nw, nh), Image.BILINEAR), dtype=np.float32) / 255.0
    pad = np.zeros((S, S, 3), np.float32)
    ph, pw = (S - nh) // 2, (S - nw) // 2
    pad[ph:ph + nh, pw:pw + nw] = small
    x = pad.transpose(2, 0, 1)[None]
    name = sess.get_inputs()[0].name
    pred = sess.run(None, {name: x})[0][0, 0]
    pred = pred[ph:ph + nh, pw:pw + nw]
    m = Image.fromarray((np.clip(pred, 0, 1) * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)
    return np.asarray(m)


def cutout(src, dst, model, threshold=128):
    img = Image.open(src)
    m = mask(img, model)
    a = np.where(m >= threshold, 255, 0).astype(np.uint8)
    rgba = np.dstack([np.asarray(img.convert('RGB')), a])
    os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
    Image.fromarray(rgba, 'RGBA').save(dst)
    return float((a > 0).mean())


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--model', default='D:/AI/models/isnetis.onnx')
    ap.add_argument('--threshold', type=int, default=128)
    a = ap.parse_args()
    print('foreground', round(cutout(a.src, a.dst, a.model, a.threshold), 3))
