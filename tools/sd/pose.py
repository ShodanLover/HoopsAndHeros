"""Draws OpenPose skeleton images (the 18-keypoint COCO layout and colours ControlNet expects) for the
basketball poses we generate, so every athlete is painted in the same stance and framing.

  python tools/sd/pose.py art/gen/poses        -> one PNG per pose, 512x768
"""
import math, os, sys
from PIL import Image, ImageDraw

W, H = 512, 768
LIMBS = [(1, 2), (1, 5), (2, 3), (3, 4), (5, 6), (6, 7), (1, 8), (8, 9), (9, 10), (1, 11), (11, 12), (12, 13),
         (1, 0), (0, 14), (14, 16), (0, 15), (15, 17)]
COLORS = [(255, 0, 0), (255, 85, 0), (255, 170, 0), (255, 255, 0), (170, 255, 0), (85, 255, 0), (0, 255, 0),
          (0, 255, 85), (0, 255, 170), (0, 255, 255), (0, 170, 255), (0, 85, 255), (0, 0, 255), (85, 0, 255),
          (170, 0, 255), (255, 0, 255), (255, 0, 85), (255, 0, 170)]

# Keypoints in a 100 x 150 frame (x right, y down). Indices: 0 nose, 1 neck, 2 R shoulder, 3 R elbow,
# 4 R wrist, 5 L shoulder, 6 L elbow, 7 L wrist, 8 R hip, 9 R knee, 10 R ankle, 11 L hip, 12 L knee,
# 13 L ankle, 14 R eye, 15 L eye, 16 R ear, 17 L ear. "R" is the subject's right (screen left when facing us).
BASE = {0: (50, 22), 1: (50, 34), 2: (40, 35), 5: (60, 35), 8: (44, 76), 11: (56, 76), 14: (48, 20), 15: (52, 20), 16: (45, 21), 17: (55, 21)}
POSES = {
    'stand': {3: (37, 52), 4: (36, 68), 6: (63, 52), 7: (64, 68), 9: (43, 103), 10: (43, 130), 12: (57, 103), 13: (57, 130)},
    'dribble': {3: (37, 52), 4: (37, 66), 6: (65, 52), 7: (70, 70), 9: (42, 102), 10: (40, 130), 12: (59, 102), 13: (61, 130)},
    'shoot': {3: (42, 20), 4: (46, 8), 6: (60, 22), 7: (53, 9), 9: (44, 101), 10: (44, 127), 12: (56, 101), 13: (56, 127)},
    'defend': {3: (28, 44), 4: (20, 52), 6: (72, 44), 7: (80, 52), 9: (38, 100), 10: (34, 128), 12: (62, 100), 13: (66, 128)},
    'celebrate': {3: (32, 22), 4: (28, 8), 6: (68, 22), 7: (72, 8), 9: (43, 103), 10: (43, 130), 12: (57, 103), 13: (57, 130)},
}


# HD-2D proportions (about 3.5 heads tall): big head, short limbs. Same keypoint indices as above.
CHIBI_BASE = {0: (50, 36), 1: (50, 58), 2: (39, 60), 5: (61, 60), 8: (44, 92), 11: (56, 92),
              14: (45, 31), 15: (55, 31), 16: (39, 33), 17: (61, 33)}
CHIBI = {
    'stand': {3: (35, 74), 4: (35, 87), 6: (65, 74), 7: (65, 87), 9: (44, 110), 10: (44, 128), 12: (56, 110), 13: (56, 128)},
    'dribble': {3: (35, 74), 4: (36, 86), 6: (66, 72), 7: (71, 86), 9: (42, 110), 10: (41, 128), 12: (58, 110), 13: (59, 128)},
    'shoot': {3: (40, 44), 4: (45, 30), 6: (61, 45), 7: (55, 30), 9: (44, 110), 10: (44, 126), 12: (56, 110), 13: (56, 126)},
    'defend': {3: (28, 68), 4: (20, 76), 6: (72, 68), 7: (80, 76), 9: (38, 110), 10: (35, 127), 12: (62, 110), 13: (65, 127)},
    'celebrate': {3: (31, 46), 4: (27, 32), 6: (69, 46), 7: (73, 32), 9: (44, 110), 10: (44, 128), 12: (56, 110), 13: (56, 128)},
}


def draw(kp, scale=W / 100.0, oy=(H - 150 * W / 100.0) / 2):
    im = Image.new('RGB', (W, H), (0, 0, 0))
    over = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    P = {k: (x * scale, y * scale + oy) for k, (x, y) in kp.items()}
    for i, (a, b) in enumerate(LIMBS):
        if a in P and b in P:
            (x0, y0), (x1, y1) = P[a], P[b]
            length = math.hypot(x1 - x0, y1 - y0)
            ang = math.atan2(y1 - y0, x1 - x0)
            cx, cy, wd = (x0 + x1) / 2, (y0 + y1) / 2, 4 * scale / 5.12 * 1.0
            pts = []
            for t in range(0, 360, 10):
                r = math.radians(t)
                ex, ey = math.cos(r) * length / 2, math.sin(r) * wd
                pts.append((cx + ex * math.cos(ang) - ey * math.sin(ang), cy + ex * math.sin(ang) + ey * math.cos(ang)))
            d.polygon(pts, fill=COLORS[i] + (153,))
    im = Image.alpha_composite(im.convert('RGBA'), over).convert('RGB')
    d = ImageDraw.Draw(im)
    for k, (x, y) in P.items():
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=COLORS[k])
    return im


def main(out):
    os.makedirs(out, exist_ok=True)
    for prefix, base, poses in (('', BASE, POSES), ('chibi_', CHIBI_BASE, CHIBI)):
        for name, kp in poses.items():
            full = dict(base); full.update(kp)
            draw(full).save(os.path.join(out, prefix + name + '.png'))
    print('wrote', len(POSES) + len(CHIBI), 'poses to', out)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'art/gen/poses')
