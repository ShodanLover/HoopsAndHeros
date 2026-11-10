"""Generates the court-player PixelSpecs for agent-sprite-forge codeart2d.

The art is authored here as code (pixel coordinates on a 24x35 canvas, feet at the bottom) and
written out as two PixelSpec files that codeart2d renders, outlines and checks:

  art/sprites/player/player-parts.pixelspec.json   un-outlined parts (body per leg pose and facing,
                                                    arms per pose, hair per style and facing). The
                                                    game composites these at runtime and recolors
                                                    the slot colors per athlete (js/sprites.js).
  art/sprites/player/player-review.pixelspec.json  outlined composites in real team colors, for
                                                    review sheets and pixel QA.

Slot colors are placeholders that the packer maps back to letters (tools/sprites/pack_player.py).
Run:  python tools/sprites/player_spec.py
"""
import json, os

W, H = 24, 35
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'art', 'sprites', 'player')

SLOTS = {
    's': '#e0a070',  # skin
    'S': '#b07850',  # skin shade
    'e': '#1a1210',  # eyes / face detail
    'j': '#3060d0',  # jersey
    'J': '#203c90',  # jersey shade
    't': '#f0d040',  # trim (shorts, jersey trim)
    'T': '#b09020',  # trim shade
    'w': '#f4f4f4',  # shoe
    'W': '#a0a0a8',  # shoe shade
    'o': '#fbfbf5',  # sock
    'c': '#e1a171',  # compression sleeve slot (skin when not equipped)
    'C': '#b17951',  # compression shade slot
    'r': '#e2a272',  # wristband slot (skin when not equipped)
    'h': '#3a2a20',  # hair
    'H': '#6a4a30',  # hair highlight
}


def blank():
    return [['.'] * W for _ in range(H)]


def put(g, x, y, c):
    if 0 <= x < W and 0 <= y < H:
        g[y][x] = c


def rect(g, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(g, x, y, c)


def line(g, a, b, c):
    (x0, y0), (x1, y1) = a, b
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err = dx + dy
    pts = []
    while True:
        pts.append((x0, y0))
        put(g, x0, y0, c)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy; x0 += sx
        if e2 <= dx:
            err += dx; y0 += sy
    return pts


def rows(g):
    return [''.join(r) for r in g]


def mirror_pt(p):
    return (23 - p[0], p[1])


# ---------------------------------------------------------------- body (head, torso, shorts, legs)
LEGS = {
    # name: (left leg rows, right leg rows) as dicts of leg geometry
    'stand': dict(l=(9, 27, 29, 8), r=(13, 27, 29, 13)),
    'run_a': dict(l=(9, 27, 27, 8, -2), r=(13, 27, 29, 13)),
    'run_c': dict(l=(9, 27, 29, 8), r=(13, 27, 27, 13, -2)),
    'jump': dict(l=(8, 27, 28, 7, -1), r=(14, 27, 28, 14, -1)),
    'stance': dict(l=(8, 27, 29, 7), r=(14, 27, 29, 14)),
}


def draw_leg(g, spec, right):
    x, y0, y1, shoe_x = spec[:4]
    lift = spec[4] if len(spec) > 4 else 0
    a, b = ('c', 'C') if right else ('s', 'S')
    for y in range(y0, y1 + 1):
        put(g, x, y, a); put(g, x + 1, y, b)
    sock = y1 + 1
    put(g, x, sock, 'o'); put(g, x + 1, sock, 'o')
    sy = sock + 1
    rect(g, shoe_x, sy, shoe_x + 2, sy, 'w')
    rect(g, shoe_x, sy + 1, shoe_x + 2, sy + 1, 'W')
    return lift


def body(facing, legs):
    g = blank()
    # legs first (shorts overlap the tops)
    L = LEGS[legs]
    draw_leg(g, L['l'], False)
    draw_leg(g, L['r'], True)
    # shorts
    rect(g, 8, 22, 15, 26, 't')
    for y in range(22, 27):
        put(g, 8, y, 'j'); put(g, 15, y, 'j'); put(g, 14, y, 'T')
    for y in (25, 26):
        put(g, 11, y, '.'); put(g, 12, y, '.')
        put(g, 10, y, 'T')
    # torso (tank top)
    rect(g, 8, 15, 15, 18, 'j')
    rect(g, 9, 19, 14, 21, 'j')
    for y in range(15, 22):
        put(g, 15 if y <= 18 else 14, y, 'J')
    for y in (15, 16, 17):
        put(g, 8, y, 't'); put(g, 15, y, 't')
    rect(g, 9, 21, 14, 21, 't')  # waistband
    put(g, 14, 21, 'T')
    if facing == 'front':
        put(g, 11, 15, 't'); put(g, 12, 15, 't'); put(g, 11, 16, 'S'); put(g, 12, 16, 'S')
        put(g, 10, 15, 't'); put(g, 13, 15, 't')
    else:
        rect(g, 10, 15, 13, 15, 't')
    # neck
    rect(g, 10, 14, 13, 14, 'S')
    # head
    rect(g, 10, 7, 13, 7, 's')
    rect(g, 9, 8, 14, 12, 's')
    rect(g, 10, 13, 13, 13, 's')
    for y in range(8, 13):
        put(g, 14, y, 'S')
    put(g, 13, 13, 'S')
    put(g, 8, 10, 's'); put(g, 15, 10, 'S')  # ears
    if facing == 'front':
        put(g, 10, 10, 'e'); put(g, 13, 10, 'e')
        put(g, 11, 12, 'S'); put(g, 12, 12, 'S')
    return g


# ---------------------------------------------------------------- arms
SHOULDER_L = (6, 16)
# Each pose: list of points for the screen-left arm, and for the screen-right arm (or 'mirror').
ARMS = {
    'idle':    ([SHOULDER_L, (5, 19), (5, 22)], [mirror_pt(SHOULDER_L), (19, 19), (19, 22)]),
    'run_a':   ([SHOULDER_L, (4, 18), (5, 15)], [mirror_pt(SHOULDER_L), (18, 19), (18, 22)]),
    'run_c':   ([SHOULDER_L, (5, 19), (5, 22)], [mirror_pt(SHOULDER_L), (19, 18), (18, 15)]),
    'shoot':   ([SHOULDER_L, (7, 11), (9, 4)], [mirror_pt(SHOULDER_L), (17, 10), (14, 3)]),
    'dunk':    ([SHOULDER_L, (4, 13), (4, 10)], [mirror_pt(SHOULDER_L), (17, 9), (16, 2)]),
    'block':   ([SHOULDER_L, (5, 10), (5, 3)], 'mirror'),
    'defend':  ([SHOULDER_L, (4, 17), (2, 19)], 'mirror'),
    'up':      ([SHOULDER_L, (5, 12), (4, 6)], 'mirror'),
    'flex':    ([SHOULDER_L, (3, 16), (3, 11)], 'mirror'),
    'sky':     ([SHOULDER_L, (8, 10), (8, 3)], 'mirror'),
    'point':   ([SHOULDER_L, (5, 19), (5, 23)], [mirror_pt(SHOULDER_L), (18, 11), (18, 4)]),
    'pass':    ([SHOULDER_L, (5, 19), (5, 22)], [mirror_pt(SHOULDER_L), (19, 16), (21, 15)]),
}


def draw_arm(g, pts, side):
    # side -1 = screen-left arm (thickness grows toward +x), +1 = screen-right (toward -x)
    off = 1 if side < 0 else -1
    path = []
    for a, b in zip(pts, pts[1:]):
        seg = line(g, a, b, 's')
        path += seg if not path else seg[1:]
    for (x, y) in path:
        put(g, x + off, y, 'S' if side > 0 else 's')
        put(g, x, y, 's')
    # wristband slot two steps before the hand
    if len(path) > 3:
        wx, wy = path[-3]
        put(g, wx, wy, 'r'); put(g, wx + off, wy, 'r')
    hx, hy = pts[-1]
    for dx in (0, off):
        for dy in (0, 1):
            put(g, hx + dx, hy + dy, 's')


def arms(pose):
    g = blank()
    l, r = ARMS[pose]
    if r == 'mirror':
        r = [mirror_pt(p) for p in l]
    draw_arm(g, l, -1)
    draw_arm(g, r, 1)
    return g


# ---------------------------------------------------------------- hair (12 styles x 2 facings)
def hair(style, facing):
    g = blank()
    h, Hh = 'h', 'H'
    front = facing == 'front'

    def cap(top=6):
        rect(g, 10, top, 13, top, h)
        rect(g, 9, top + 1, 14, 7 if front else 11, h)
        if not front:
            rect(g, 10, 12, 13, 12, h)

    if style == 'bald':
        return g
    if style in ('buzz', 'fade'):
        rect(g, 10, 7, 13, 7, h)
        rect(g, 9, 8, 14, 8, h)
        if style == 'fade':
            put(g, 10, 6, h); put(g, 11, 6, h); put(g, 12, 6, h); put(g, 13, 6, h)
            put(g, 11, 6, Hh)
        if not front:
            rect(g, 9, 9, 14, 10 if style == 'buzz' else 9, h)
            if style == 'fade':
                rect(g, 9, 10, 14, 10, Hh)
        else:
            put(g, 9, 9, h); put(g, 14, 9, h)
    elif style == 'waves':
        cap()
        for x in (10, 12):
            put(g, x, 7, Hh)
        if not front:
            for y in (8, 10):
                for x in range(9 + (y // 2) % 2, 15, 2):
                    put(g, x, y, Hh)
        else:
            put(g, 9, 8, h); put(g, 14, 8, h)
    elif style == 'curls':
        for x in (9, 11, 13):
            put(g, x, 5, h); put(g, x + 1, 5, h)
        rect(g, 8, 6, 15, 7, h)
        put(g, 8, 8, h); put(g, 15, 8, h)
        for x in (10, 12, 14):
            put(g, x, 6, Hh)
        if not front:
            rect(g, 8, 8, 15, 12, h)
            for (x, y) in ((9, 9), (12, 9), (10, 11), (14, 11)):
                put(g, x, y, Hh)
        else:
            rect(g, 9, 8, 14, 8, h)
    elif style == 'afro':
        rect(g, 10, 3, 13, 3, h)
        rect(g, 8, 4, 15, 4, h)
        rect(g, 7, 5, 16, 8, h)
        put(g, 10, 4, Hh); put(g, 9, 5, Hh); put(g, 11, 5, Hh)
        if front:
            for y in (9, 10, 11):
                put(g, 7, y, h); put(g, 8, y, h); put(g, 15, y, h); put(g, 16, y, h)
            put(g, 8, 12, h); put(g, 15, 12, h)
        else:
            rect(g, 7, 9, 16, 11, h)
            rect(g, 8, 12, 15, 12, h)
    elif style == 'mohawk':
        rect(g, 11, 3, 12, 8, h)
        put(g, 11, 3, Hh); put(g, 11, 5, Hh)
        if not front:
            rect(g, 11, 9, 12, 12, h)
    elif style == 'spiky':
        for x in (9, 11, 13):
            put(g, x, 5, h)
        for x in (10, 12, 14):
            put(g, x, 4, h); put(g, x, 5, h)
        rect(g, 9, 6, 14, 7, h)
        put(g, 10, 4, Hh); put(g, 14, 4, Hh)
        if front:
            put(g, 9, 8, h); put(g, 14, 8, h)
        else:
            rect(g, 9, 8, 14, 11, h)
    elif style == 'flattop':
        rect(g, 9, 3, 14, 7, h)
        rect(g, 9, 3, 14, 3, Hh)
        if front:
            put(g, 9, 8, h); put(g, 14, 8, h)
        else:
            rect(g, 9, 8, 14, 10, h)
    elif style == 'bun':
        rect(g, 11, 3, 12, 3, h)
        rect(g, 10, 4, 13, 5, h)
        put(g, 11, 4, Hh)
        cap()
        if front:
            put(g, 9, 8, h); put(g, 14, 8, h)
    elif style in ('locs', 'braids'):
        cap()
        if style == 'braids':
            for x in (10, 12, 14):
                for y in range(6, 8 if front else 12):
                    put(g, x, y, Hh)
        if front:
            put(g, 9, 8, h); put(g, 14, 8, h)
            cols = (8, 15) if style == 'locs' else (8, 15)
            for x in cols:
                for y in range(8, 17 if style == 'locs' else 18):
                    put(g, x, y, h if (y + x) % 3 else Hh)
            if style == 'locs':
                for x in (9, 14):
                    for y in range(9, 14):
                        put(g, x, y, h if y % 2 else Hh)
        else:
            xs = (9, 10, 11, 12, 13, 14) if style == 'locs' else (10, 13)
            for x in xs:
                for y in range(13, 19 if style == 'locs' else 20):
                    put(g, x, y, h if (y + x) % 3 else Hh)
    else:
        raise ValueError(style)
    return g


HAIR_STYLES = ['buzz', 'afro', 'fade', 'braids', 'bald', 'curls', 'mohawk', 'flattop', 'locs', 'bun', 'spiky', 'waves']
FACINGS = ['back', 'front']
LEG_POSES = list(LEGS)
ARM_POSES = list(ARMS)


def compose(facing, legs, arm, style):
    """The game's composite order: back view hides raised arms behind the head, front view shows them over it."""
    out = blank()
    layers = [body(facing, legs)]
    layers += [arms(arm), hair(style, facing)] if facing == 'back' else [hair(style, facing), arms(arm)]
    for lay in layers:
        for y in range(H):
            for x in range(W):
                if lay[y][x] != '.':
                    out[y][x] = lay[y][x]
    return out


def spec_base(name, outline):
    return {
        'schema': 'codeart2d.pixelspec.v1',
        'name': name,
        'canvas': [W, H],
        'anchor_px': [12, 34],
        'palette': dict(SLOTS, **({'k': '#0c0a18'} if outline else {})),
        'outline': {'mode': 'solid', 'color': 'k'} if outline else {'mode': 'none'},
        'layers': [{'name': 'art', 'origin': [0, 0], 'rows': rows(blank_with_dot())}],
    }


def blank_with_dot():
    g = blank(); g[34 - 1][12] = '.'
    return g


def main():
    os.makedirs(OUT, exist_ok=True)
    # parts (no outline): every part is its own frame on the shared canvas
    parts = spec_base('player-parts', False)
    parts['poses'] = {}
    frames = []
    for f in FACINGS:
        for lg in LEG_POSES:
            n = 'body_%s_%s' % (f, lg); parts['poses'][n] = rows(body(f, lg)); frames.append(n)
    for a in ARM_POSES:
        n = 'arms_%s' % a; parts['poses'][n] = rows(arms(a)); frames.append(n)
    for f in FACINGS:
        for st in HAIR_STYLES:
            g = hair(st, f)
            if all(c == '.' for r in g for c in r):
                continue  # bald: nothing to draw
            n = 'hair_%s_%s' % (f, st); parts['poses'][n] = rows(g); frames.append(n)
    parts['layers'] = [{'name': 'art', 'origin': [0, 0], 'rows': frames[0]}]
    parts['frames'] = [{'name': n, 'layers': {'art': {'rows': n}}} for n in frames]

    # review composites (outlined, team colors): every arm pose and leg pose, cycling hair styles
    rev = spec_base('player-review', True)
    rev['variants'] = {
        'home': {'j': '#ff6a1f', 'J': '#c4470f', 't': '#1b1f3a', 'T': '#0f1226', 'h': '#121014', 'H': '#3a3238', 's': '#8d5a3b', 'S': '#6b4129', 'c': '#8d5a3b', 'C': '#6b4129', 'r': '#8d5a3b'},
        'away': {'j': '#f4f1ea', 'J': '#b9b4a8', 't': '#2a7de1', 'T': '#1b55a0', 'h': '#d6b25a', 'H': '#f0d890', 'c': '#1a1d26', 'C': '#0c0e14', 'r': '#ffb22e'},
    }
    rev['poses'] = {}
    combos = []
    i = 0
    for f in FACINGS:
        for a in ARM_POSES:
            lg = {'run_a': 'run_a', 'run_c': 'run_c', 'defend': 'stance', 'shoot': 'jump', 'dunk': 'jump', 'block': 'jump'}.get(a, 'stand')
            combos.append((f, lg, a, HAIR_STYLES[i % len(HAIR_STYLES)])); i += 1
    names = []
    for (f, lg, a, st) in combos:
        n = '%s_%s_%s' % (f, a, st)
        rev['poses'][n] = rows(compose(f, lg, a, st)); names.append(n)
    rev['layers'] = [{'name': 'art', 'origin': [0, 0], 'rows': names[0]}]
    rev['frames'] = [{'name': n, 'layers': {'art': {'rows': n}}} for n in names]

    for spec in (parts, rev):
        p = os.path.join(OUT, spec['name'] + '.pixelspec.json')
        with open(p, 'w', encoding='utf8', newline='\n') as fh:
            json.dump(spec, fh, indent=1)
            fh.write('\n')
        print('wrote', os.path.relpath(p, ROOT), len(spec['frames']), 'frames')


if __name__ == '__main__':
    main()
