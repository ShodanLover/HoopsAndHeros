"""One command to rebuild the court-player sprites with agent-sprite-forge codeart2d.

  python tools/sprites/build_player.py

1. Regenerates the PixelSpecs (tools/sprites/player_spec.py).
2. Renders them with codeart2d render_pixelspec.py --strict-qc into art/sprites/player/build/.
3. Packs the un-outlined parts into js/sprite-data.js (tools/sprites/pack_player.py).

Set SPRITE_FORGE to the agent-sprite-forge plugin folder if it isn't found automatically.
"""
import glob, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
ART = os.path.join(ROOT, 'art', 'sprites', 'player')
BUILD = os.path.join(ART, 'build')


def forge_dir():
    env = os.environ.get('SPRITE_FORGE')
    if env:
        return env
    pat = os.path.join(os.path.expanduser('~'), '.claude', 'plugins', 'cache', 'agent-sprite-forge', 'agent-sprite-forge', '*')
    found = sorted(glob.glob(pat))
    if not found:
        sys.exit('agent-sprite-forge not found; install the plugin or set SPRITE_FORGE')
    return found[-1]


def run(args):
    env = dict(os.environ, PYTHONUTF8='1')
    r = subprocess.run([sys.executable] + args, cwd=ROOT, env=env, capture_output=True, text=True)
    out = (r.stdout + r.stderr).strip()
    print(out.splitlines()[-1] if out else '(no output)')
    if r.returncode != 0:
        print(out)
        sys.exit(r.returncode)


def main():
    render = os.path.join(forge_dir(), 'skills', 'codeart2d', 'scripts', 'render_pixelspec.py')
    run([os.path.join(HERE, 'player_spec.py')])
    if os.path.isdir(BUILD):
        shutil.rmtree(BUILD)
    run([render, '--spec', os.path.join(ART, 'player-parts.pixelspec.json'), '--output-dir', os.path.join(BUILD, 'parts'), '--preview-scale', '4', '--strict-qc'])
    run([render, '--spec', os.path.join(ART, 'player-review.pixelspec.json'), '--output-dir', os.path.join(BUILD, 'review'), '--variants', 'all', '--preview-scale', '4', '--strict-qc'])
    run([os.path.join(HERE, 'pack_player.py')])


if __name__ == '__main__':
    main()
