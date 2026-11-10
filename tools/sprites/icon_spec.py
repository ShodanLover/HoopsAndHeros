"""Generates the 16x16 UI icon PixelSpec for agent-sprite-forge codeart2d.

Every icon is drawn here as code on a 16x16 grid with two tones: 'x' (full color) and 'o' (a
translucent second tone). In the game both tones use `currentColor`, so icons keep taking the color
of the button they sit in. Output: art/sprites/icons/icons.pixelspec.json (one frame per icon).
Run: python tools/sprites/icon_spec.py   (or tools/sprites/build_icons.py for the whole pipeline)
"""
import json, os

N = 16
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'art', 'sprites', 'icons')
PALETTE = {'x': '#f2f4ff', 'o': '#7f87a8'}


class G:
    def __init__(self):
        self.g = [['.'] * N for _ in range(N)]

    def p(self, x, y, c='x'):
        if 0 <= x < N and 0 <= y < N:
            self.g[y][x] = c

    def rect(self, x0, y0, x1, y1, c='x'):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.p(x, y, c)

    def box(self, x0, y0, x1, y1, c='x'):
        for x in range(x0, x1 + 1):
            self.p(x, y0, c); self.p(x, y1, c)
        for y in range(y0, y1 + 1):
            self.p(x0, y, c); self.p(x1, y, c)

    def line(self, x0, y0, x1, y1, c='x', t=1):
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            for k in range(t):
                if dx >= -dy:
                    self.p(x0, y0 + k, c)
                else:
                    self.p(x0 + k, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy; x0 += sx
            if e2 <= dx:
                err += dx; y0 += sy

    def disc(self, cx, cy, r, c='x'):
        for y in range(N):
            for x in range(N):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.5:
                    self.p(x, y, c)

    def ring(self, cx, cy, r, c='x', w=1.6):
        for y in range(N):
            for x in range(N):
                d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                if r - w < d <= r + 0.35:
                    self.p(x, y, c)

    def clear(self, x0, y0, x1, y1):
        self.rect(x0, y0, x1, y1, '.')

    def rows(self, art, ox=0, oy=0):
        for j, r in enumerate(art):
            for i, ch in enumerate(r):
                if ch != '.':
                    self.p(ox + i, oy + j, ch)

    def out(self):
        return [''.join(r) for r in self.g]


C = 7.5  # centre of the grid
ICONS = {}


def icon(name):
    def deco(fn):
        g = G(); fn(g); ICONS[name] = g.out()
        return fn
    return deco


@icon('ball')
def _(g):
    g.disc(C, C, 7.6)
    g.rows(['......oo......', '.....o..o.....', '....o....o....', '....o....o....', '...o......o...',
            'oooooooooooooo', 'oooooooooooooo', '...o......o...', '....o....o....', '....o....o....',
            '.....o..o.....', '......oo......'], 1, 2)
    g.rect(7, 0, 8, 15, 'o')

@icon('coin')
def _(g):
    g.disc(C, C, 7.6); g.ring(C, C, 6, 'o', 1)
    g.rows(['..o..', '.ooo.', 'o....', '.ooo.', '....o', 'oooo.', '..o..'], 6, 4)


@icon('cash')
def _(g):
    g.rect(0, 3, 15, 12); g.rect(1, 4, 14, 11, 'o'); g.disc(C, C, 3); g.disc(C, C, 1.2, 'o')
    g.rect(2, 7, 3, 8); g.rect(12, 7, 13, 8)


@icon('gem')
def _(g):
    g.rows(['...xxxxxxxxxx...', '..xxoooxxoooxx..', '.xxoooxxxxoooxx.', 'xxxxxxxxxxxxxxxx',
            '.xxooxxxxxxooxx.', '..xxooxxxxooxx..', '...xxoxxxxoxx...', '....xxoxxoxx....',
            '.....xxxxxx.....', '......xxxx......', '.......xx.......'], 0, 2)


@icon('ticket')
def _(g):
    g.rect(0, 3, 15, 12); g.clear(0, 6, 0, 9); g.clear(15, 6, 15, 9)
    for y in range(4, 12, 2):
        g.p(10, y, '.')
    g.rows(['.x.', 'xxx', '.x.'], 3, 6); g.rect(3, 6, 5, 8, 'o'); g.p(4, 7, 'x')


@icon('jersey')
def _(g):
    g.rows(['...xxx....xxx...', '..xxxxx..xxxxx..', '.xxxxxxxxxxxxxx.', 'xxxx.xxxxxx.xxxx',
            'xxx..xxxxxx..xxx', '.....xxxxxx.....'], 0, 1)
    g.rect(4, 7, 11, 14); g.rect(6, 9, 9, 12, 'o'); g.rect(7, 9, 8, 12, 'x')


@icon('cards')
def _(g):
    g.rect(5, 0, 15, 12, 'o'); g.rect(0, 3, 10, 15); g.rect(1, 4, 9, 14, 'o')
    g.rows(['..x..', '.xxx.', 'xxxxx', '.xxx.', 'x...x'], 3, 7)


ICONS['recruit'] = None  # alias filled below


@icon('empire')
def _(g):
    g.rows(['.......xx.......', '......xxxx......', '.....xxxxxx.....', '....xxxxxxxx....',
            '...xxxxxxxxxx...', '..xxxxxxxxxxxx..', '.xxxxxxxxxxxxxx.'], 0, 1)
    g.rect(2, 8, 13, 14); g.rect(0, 15, 15, 15)
    g.rect(4, 9, 5, 11, 'o'); g.rect(10, 9, 11, 11, 'o'); g.rect(6, 11, 9, 14, 'o')


@icon('shop')
def _(g):
    g.box(5, 1, 10, 5); g.box(4, 1, 11, 5); g.clear(5, 2, 10, 5)
    g.rows(['.xxxxxxxxxxxxxx.'], 0, 5)
    g.rect(1, 5, 14, 15); g.rect(3, 7, 12, 13, 'o')
    g.p(4, 6, 'x'); g.p(11, 6, 'x')


@icon('gear')
def _(g):
    g.disc(C, C, 5.6)
    for (x0, y0, x1, y1) in ((6, 0, 9, 2), (6, 13, 9, 15), (0, 6, 2, 9), (13, 6, 15, 9)):
        g.rect(x0, y0, x1, y1)
    for (x, y) in ((2, 2), (12, 2), (2, 12), (12, 12)):
        g.rect(x, y, x + 1, y + 1)
    g.disc(C, C, 2.3, '.')


@icon('map')
def _(g):
    g.rows(['xx....xx....xx..', 'xxxx..xxxx..xxxx'], 0, 1)
    g.rect(0, 2, 15, 13); g.rect(5, 2, 5, 13, 'o'); g.rect(10, 2, 10, 13, 'o')
    g.rect(1, 4, 4, 12, 'o'); g.rect(11, 4, 14, 12, 'o'); g.rect(6, 3, 9, 11, 'o')
    g.rows(['x.x', '.x.', 'x.x'], 6, 5)
    g.rows(['xx....xx....xx..'], 0, 14)


@icon('missions')
def _(g):
    g.rect(2, 1, 13, 15); g.rect(3, 3, 12, 14, 'o'); g.rect(5, 0, 10, 2)
    g.line(4, 7, 6, 9, 'x', 2); g.line(6, 9, 10, 5, 'x', 2); g.rect(5, 12, 10, 12)


@icon('daily')
def _(g):
    g.rect(0, 5, 15, 15); g.rect(7, 5, 8, 15, 'o'); g.rect(0, 8, 15, 9, 'o')
    g.rows(['..xxx....xxx..', '.x...x..x...x.', '.x....xx....x.', '..xxxxxxxxxx..'], 1, 1)


@icon('pass')
def _(g):
    g.rows(['x......xx......x', 'xx.....xx.....xx', 'xxx...xxxx...xxx', 'xxxx.xxxxxx.xxxx',
            'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', '.xxxxxxxxxxxxxx.'], 0, 3)
    g.rect(2, 9, 13, 9, 'o'); g.rect(1, 12, 14, 13)


@icon('events')
def _(g):
    g.disc(C, C, 7.6); g.disc(C, C, 5.4, 'o'); g.disc(C, C, 3.4); g.disc(C, C, 1.4, 'o')


@icon('social')
def _(g):
    g.disc(5, 4.5, 3); g.rect(0, 10, 10, 15); g.rect(1, 9, 9, 9); g.disc(12, 5.5, 2.3, 'o'); g.rect(11, 10, 15, 15, 'o'); g.rect(11, 9, 14, 9, 'o')


@icon('trophy')
def _(g):
    g.rect(3, 0, 12, 7); g.rows(['.xxxxxxxxxx.', '..xxxxxxxx..', '....xxxx....'], 2, 8)
    g.box(0, 1, 3, 5); g.box(12, 1, 15, 5); g.clear(1, 2, 2, 4); g.clear(13, 2, 14, 4)
    g.rect(6, 11, 9, 12); g.rect(4, 13, 11, 15); g.rect(5, 2, 6, 6, 'o')


@icon('lock')
def _(g):
    g.box(4, 1, 11, 7); g.box(5, 1, 10, 7); g.clear(6, 2, 9, 7); g.p(4, 1, '.'); g.p(11, 1, '.')
    g.rect(2, 7, 13, 15); g.rect(7, 10, 8, 12, 'o')


@icon('star')
def _(g):
    g.rows(['.......xx.......', '.......xx.......', '......xxxx......', '......xxxx......',
            'xxxxxxxxxxxxxxxx', '.xxxxxxxxxxxxxx.', '..xxxxxxxxxxxx..', '...xxxxxxxxxx...',
            '....xxxxxxxx....', '....xxxxxxxx....', '...xxxxxxxxxx...', '...xxxx..xxxx...',
            '..xxx......xxx..', '..xx........xx..'], 0, 1)
    g.rect(7, 5, 8, 9, 'o')


@icon('fire')
def _(g):
    g.rows(['........x.......', '.......xx.......', '......xxx...x...', '.....xxxxx.xx...',
            '....xxxxxxxxx...', '...xxxxxxxxxxx..', '..xxxxxxxxxxxx..', '..xxxxxooxxxxx..',
            '.xxxxxoooxxxxxx.', '.xxxxooooooxxxx.', '.xxxoooooooxxxx.', '.xxxooooooooxxx.',
            '..xxoooooooxxx..', '...xxxooooxxx...', '....xxxxxxxx....'], 0, 1)


@icon('bolt')
def _(g):
    g.rows(['........xxxxx...', '.......xxxxx....', '......xxxxx.....', '.....xxxxx......',
            '....xxxxx.......', '...xxxxxxxxxx...', '..xxxxxxxxxx....', '.......xxxx.....',
            '......xxxx......', '.....xxxx.......', '....xxxx........', '...xxx..........',
            '..xx............', '.x..............'], 1, 1)


@icon('shield')
def _(g):
    g.rows(['.......xx.......', '....xxxxxxxx....', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx',
            'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', '.xxxxxxxxxxxxxx.',
            '.xxxxxxxxxxxxxx.', '..xxxxxxxxxxxx..', '...xxxxxxxxxx...', '....xxxxxxxx....',
            '......xxxx......', '.......xx.......'], 0, 1)
    g.line(4, 7, 6, 9, 'o', 2); g.line(6, 9, 11, 4, 'o', 2)


@icon('clock')
def _(g):
    g.disc(C, C, 7.6); g.disc(C, C, 5.6, 'o'); g.rect(7, 3, 8, 8); g.rect(8, 7, 11, 8)


@icon('up')
def _(g):
    for i in range(7):
        g.rect(7 - i, 1 + i, 8 + i, 2 + i)
    g.rect(5, 8, 10, 15)


@icon('play')
def _(g):
    for i in range(7):
        g.rect(3, 1 + i, 3 + 2 * i, 14 - i)


@icon('ff')
def _(g):
    for i in range(6):
        g.rect(0, 2 + i, i, 13 - i); g.rect(8, 2 + i, 8 + i, 13 - i)
    g.rect(0, 2, 1, 13); g.rect(8, 2, 9, 13)


@icon('check')
def _(g):
    g.line(1, 8, 5, 12, 'x', 3); g.line(5, 12, 14, 3, 'x', 3)


@icon('x')
def _(g):
    g.line(2, 2, 13, 13, 'x', 3); g.line(13, 2, 2, 13, 'x', 3)


@icon('plus')
def _(g):
    g.rect(6, 1, 9, 14); g.rect(1, 6, 14, 9)


@icon('info')
def _(g):
    g.disc(C, C, 7.6); g.rect(7, 3, 8, 4, '.'); g.rect(7, 6, 8, 12, '.'); g.rect(6, 6, 6, 6, '.'); g.rect(6, 12, 9, 12, '.')


@icon('shoe')
def _(g):
    g.rows(['....xxxxx.......', '....xxxxx.......', '....xoxox.......', '....xxxxxx......',
            '...xxxxxxxxx....', 'xxxxxxxxxxxxxxx.', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx'], 0, 4)
    g.rect(0, 12, 15, 13, 'o')


@icon('headband')
def _(g):
    g.rows(['.....xxxxxx.....', '...xxxxxxxxxx...', '..xx........xx..', '.xx..........xx.'], 0, 2)
    g.rect(0, 6, 15, 9); g.rect(2, 7, 13, 8, 'o'); g.rect(0, 10, 1, 13); g.rect(14, 10, 15, 13)


@icon('wrist')
def _(g):
    g.rect(4, 0, 11, 3, 'o'); g.rect(4, 12, 11, 15, 'o'); g.rect(2, 4, 13, 11); g.rect(4, 6, 11, 9, 'o'); g.rect(6, 7, 9, 8)


@icon('sleeve')
def _(g):
    g.rows(['xxxxxxxxxx', 'xxxxxxxxxx', '.xxxxxxxx.', '.xxxxxxxx.', '.oooooooo.', '..xxxxxx..',
            '..xxxxxx..', '..xxxxxx..', '..oooooo..', '...xxxx...', '...xxxx...', '...xxxx...',
            '...xxxx...', '...xxxx...'], 3, 1)


@icon('dumbbell')
def _(g):
    g.rect(2, 3, 4, 12); g.rect(11, 3, 13, 12); g.rect(0, 5, 1, 10, 'o'); g.rect(14, 5, 15, 10, 'o'); g.rect(5, 7, 10, 8)


ICONS['gym'] = None


@icon('whistle')
def _(g):
    g.disc(6, 9, 5.6); g.disc(6, 9, 1.6, 'o'); g.rect(6, 3, 15, 6); g.rect(12, 7, 15, 8, 'o'); g.rect(0, 0, 3, 1, 'o')


ICONS['coach'] = None


@icon('court')
def _(g):
    g.box(0, 2, 15, 13); g.rect(1, 3, 14, 12, 'o'); g.rect(7, 3, 8, 12); g.ring(C, C, 3, 'x', 1)
    g.rect(1, 6, 3, 6); g.rect(1, 9, 3, 9); g.rect(3, 6, 3, 9); g.rect(12, 6, 14, 6); g.rect(12, 9, 14, 9); g.rect(12, 6, 12, 9)


@icon('train')
def _(g):
    g.line(1, 14, 6, 9, 'x', 2); g.rows(['......xxxxx', '....xxxxxxx', '...xxxxxxx.', '...xxxooxx.', '..xxxooxx..',
                                          '..xxxxxx...', '.xxxxxx....', '.xxxx......'], 5, 1)


@icon('merch')
def _(g):
    g.rows(['..xxxxxxxxxxxx..', '.xxxxxxxxxxxxxx.', 'xxxxxxxxxxxxxxxx', 'x.x.x.x.x.x.x.x.'], 0, 1)
    g.rect(1, 5, 14, 15); g.rect(6, 9, 9, 15, 'o'); g.rect(2, 7, 4, 9, 'o'); g.rect(11, 7, 13, 9, 'o')


@icon('hq')
def _(g):
    g.rect(2, 0, 13, 15)
    for y in (2, 5, 8):
        g.rect(4, y, 6, y + 1, 'o'); g.rect(9, y, 11, y + 1, 'o')
    g.rect(6, 11, 9, 15, 'o')


@icon('scout')
def _(g):
    g.ring(6, 6, 5.6, 'x', 2); g.disc(6, 6, 3.5, 'o'); g.line(10, 10, 14, 14, 'x', 3)


@icon('stadium')
def _(g):
    g.rows(['....xxxxxxxx....', '..xxxxxxxxxxxx..', '.xxxooooooooxxx.', 'xxoooooooooooxxx', 'xxxooooooooooxxx',
            'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', 'xxxx.xxxxxx.xxxx', 'xxxx.xxxxxx.xxxx', '.xxx.xxxxxx.xxx.',
            '..xx.xxxxxx.xx..', '....xxxxxxxx....'], 0, 2)


@icon('academy')
def _(g):
    g.rows(['.......xx.......', '.....xxxxxx.....', '...xxxxxxxxxx...', '.xxxxxxxxxxxxxx.', 'xxxxxxxxxxxxxxxx',
            '.xxxxxxxxxxxxxx.', '...xxxxxxxxxx.x.', '.....xxxxxx...x.'], 0, 2)
    g.rect(3, 9, 12, 12, 'o'); g.rect(3, 12, 12, 13); g.p(14, 10, 'x'); g.rect(13, 11, 15, 12)


@icon('medical')
def _(g):
    g.rect(1, 0, 14, 15); g.rect(0, 1, 15, 14); g.rect(6, 3, 9, 12, '.'); g.rect(3, 6, 12, 9, '.')


@icon('tactics')
def _(g):
    g.rect(1, 0, 14, 15); g.rect(2, 1, 13, 14, 'o')
    g.line(3, 3, 6, 6, 'x', 1); g.line(6, 3, 3, 6, 'x', 1); g.ring(11, 11, 2.2, 'x', 1)
    g.line(5, 11, 9, 6, 'x', 1); g.rect(9, 5, 10, 6)


@icon('legacy')
def _(g):
    g.rows(['.......xx.......', '......xxxx......', 'xxxxxxxxxxxxxxxx', '.xxxxxxxxxxxxxx.', '..xxxxxxxxxxxx..',
            '...xxxxxxxxxx...', '...xxxxxxxxxx...', '..xxxx..xxxxx...', '..xxx....xxxx...'], 0, 0)
    g.rect(7, 2, 8, 6, 'o')
    g.rect(2, 12, 13, 13); g.rect(0, 14, 15, 15, 'o')

@icon('division')
def _(g):
    g.rows(['.......xx.......', '.....xxxxxx.....', '...xxxxxxxxxx...', '.xxxxxxxxxxxxxx.',
            '...xxxxxxxxxx...', '.....xxxxxx.....', '.......xx.......'], 0, 0)
    for k, c in ((8, 'x'), (12, 'o')):
        g.rows(['xx............xx', '.xxxx......xxxx.', '...xxxxxxxxxx...'], 0, k)
        if c == 'o':
            for y in range(k, k + 3):
                g.g[y] = ['o' if v == 'x' else v for v in g.g[y]]

@icon('tv')
def _(g):
    g.rect(0, 2, 15, 12); g.rect(2, 4, 13, 10, 'o'); g.rect(5, 14, 10, 15); g.rect(7, 12, 8, 13)
    for i in range(3):
        g.rect(6 + i, 5 + i, 6 + i, 9 - i)
    g.line(4, 0, 6, 2); g.line(11, 0, 9, 2)


@icon('craft')
def _(g):
    g.rows(['.....xxxxx......', '....xxxxxxx.....', '...xxxxxxxxx....', '....xxxxxxxxx...', '.....xxxoxxxx...',
            '......xxoxxxx...', '.......xxxxxx...', '.......xxxx.....'], 2, 0)
    g.line(7, 8, 1, 14, 'x', 2)


@icon('share')
def _(g):
    g.disc(3, 8, 2.4); g.disc(12, 3, 2.4); g.disc(12, 12, 2.4); g.line(4, 7, 11, 3, 'o', 2); g.line(4, 9, 11, 12, 'o', 2)


@icon('sound')
def _(g):
    g.rect(0, 5, 3, 10); g.rows(['....xx', '...xxx', '..xxxx', '.xxxxx', 'xxxxxx', 'xxxxxx', 'xxxxxx', 'xxxxxx', '.xxxxx', '..xxxx', '...xxx', '....xx'], 3, 2)
    g.rect(10, 6, 11, 9, 'o'); g.rect(13, 4, 14, 11, 'o')


@icon('chart')
def _(g):
    g.rect(1, 8, 3, 14); g.rect(6, 2, 8, 14); g.rect(11, 6, 13, 14); g.rect(0, 15, 15, 15, 'o')


@icon('swap')
def _(g):
    g.rect(3, 3, 14, 4); g.rows(['..x', '.xx', 'xxx', '.xx', '..x'], 0, 1)
    g.rect(1, 11, 12, 12); g.rows(['x..', 'xx.', 'xxx', 'xx.', 'x..'], 13, 9)


@icon('steal')
def _(g):
    g.disc(10.5, 5, 4.6)
    g.rect(10, 1, 11, 9, 'o'); g.rect(6, 4, 15, 5, 'o')
    g.rows(['xxxx..', 'xxxxxx', 'xxxxxx', '.xxxxx', '..xxx.'], 0, 10)
    g.rect(6, 12, 9, 13, 'o')

@icon('dunk')
def _(g):
    g.disc(8, 3.4, 3.4); g.rect(5, 3, 11, 3, 'o'); g.rect(8, 0, 8, 6, 'o')
    g.rect(1, 8, 14, 9)
    g.rows(['.o.o.o.o.o.', '.o.o.o.o.o.', '..o.o.o.o..', '..o.o.o.o..', '...o.o.o...'], 2, 10)

@icon('block')
def _(g):
    g.rows(['..x.x.x.x.......', '..x.x.x.x.......', '..xxxxxxx.......', '..xxxxxxx.xx....', '..xxxxxxxxxx....',
            '..xxxxxxxxx.....', '..xxxxxxxx......', '...xxxxxx.......', '....xxxx........'], 2, 1)
    g.rect(6, 10, 9, 15, 'o')


@icon('auto')
def _(g):
    g.ring(C, C, 6.6, 'x', 2); g.clear(0, 7, 4, 8); g.clear(11, 7, 15, 8)
    g.rows(['xxxxx', '.xxx.', '..x..'], 11, 8); g.rows(['..x..', '.xxx.', 'xxxxx'], 0, 5)
    g.disc(C, C, 2, 'o')


ICONS['recruit'] = ICONS['cards']
ICONS['gym'] = ICONS['dumbbell']
ICONS['coach'] = ICONS['whistle']


def main():
    os.makedirs(OUT, exist_ok=True)
    names = sorted(ICONS)
    spec = {
        'schema': 'codeart2d.pixelspec.v1',
        'name': 'icons',
        'canvas': [N + 2, N + 2],
        'palette': PALETTE,
        'outline': {'mode': 'none'},
        'poses': {n: ICONS[n] for n in names},
        'layers': [{'name': 'icon', 'origin': [1, 1], 'rows': names[0]}],
        'frames': [{'name': n, 'layers': {'icon': {'rows': n}}} for n in names],
    }
    p = os.path.join(OUT, 'icons.pixelspec.json')
    with open(p, 'w', encoding='utf8', newline='\n') as fh:
        json.dump(spec, fh, indent=1); fh.write('\n')
    print('wrote', os.path.relpath(p, ROOT), len(names), 'icons')


if __name__ == '__main__':
    main()
