"""Minimal client for a local ComfyUI server (default http://127.0.0.1:8188).

Builds a Stable Diffusion 1.5 text-to-image workflow, optionally guided by an OpenPose ControlNet
image, queues it, waits for the result and saves the PNGs. Everything runs on this machine for free.

  python tools/sd/comfy.py --prompt "..." --out art/gen/test --seed 1 [--pose pose.png] [--n 4]
"""
import argparse, json, os, time, urllib.request, urllib.parse, uuid

HOST = os.environ.get('COMFY_HOST', 'http://127.0.0.1:8188')
CKPT = os.environ.get('SD_CKPT', 'v1-5-pruned-emaonly.safetensors')
CNET = os.environ.get('SD_CNET', 'control_v11p_sd15_openpose_fp16.safetensors')

NEGATIVE = ('photo, realistic, 3d render, blurry, gradient, noise, texture, text, watermark, logo, signature, '
            'extra limbs, extra fingers, deformed, cropped, out of frame, multiple people, shadow on ground, '
            'pixel art, jpeg artifacts')


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req))


def get(path):
    return json.load(urllib.request.urlopen(HOST + path))


def upload(path):
    boundary = uuid.uuid4().hex
    name = os.path.basename(path)
    body = (('--%s\r\nContent-Disposition: form-data; name="image"; filename="%s"\r\nContent-Type: image/png\r\n\r\n' % (boundary, name)).encode()
            + open(path, 'rb').read() + ('\r\n--%s\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--%s--\r\n' % (boundary, boundary)).encode())
    req = urllib.request.Request(HOST + '/upload/image', data=body, headers={'Content-Type': 'multipart/form-data; boundary=' + boundary})
    return json.load(urllib.request.urlopen(req))['name']


def workflow(prompt, negative, seed, w, h, n, steps, cfg, pose_name=None, pose_strength=1.0, hires=0.0):
    g = {
        '1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': CKPT}},
        '2': {'class_type': 'CLIPTextEncode', 'inputs': {'text': prompt, 'clip': ['1', 1]}},
        '3': {'class_type': 'CLIPTextEncode', 'inputs': {'text': negative, 'clip': ['1', 1]}},
        '4': {'class_type': 'EmptyLatentImage', 'inputs': {'width': w, 'height': h, 'batch_size': n}},
        '6': {'class_type': 'VAEDecode', 'inputs': {'samples': ['5', 0], 'vae': ['1', 2]}},
        '7': {'class_type': 'SaveImage', 'inputs': {'images': ['6', 0], 'filename_prefix': 'be'}},
    }
    pos, neg = ['2', 0], ['3', 0]
    if pose_name:
        g['10'] = {'class_type': 'LoadImage', 'inputs': {'image': pose_name}}
        g['11'] = {'class_type': 'ControlNetLoader', 'inputs': {'control_net_name': CNET}}
        g['12'] = {'class_type': 'ControlNetApplyAdvanced', 'inputs': {'positive': pos, 'negative': neg, 'control_net': ['11', 0],
                                                                       'image': ['10', 0], 'strength': pose_strength, 'start_percent': 0.0, 'end_percent': 1.0}}
        pos, neg = ['12', 0], ['12', 1]
    g['5'] = {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'positive': pos, 'negative': neg, 'latent_image': ['4', 0],
                                                   'seed': seed, 'steps': steps, 'cfg': cfg, 'sampler_name': 'dpmpp_2m', 'scheduler': 'karras', 'denoise': 1.0}}
    if hires and hires > 1.0:
        # hires fix: upscale the latent and re-sample at low denoise, which sharpens faces and hands
        g['8'] = {'class_type': 'LatentUpscaleBy', 'inputs': {'samples': ['5', 0], 'upscale_method': 'nearest-exact', 'scale_by': hires}}
        g['9'] = {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'positive': pos, 'negative': neg, 'latent_image': ['8', 0],
                                                       'seed': seed, 'steps': max(12, steps // 2), 'cfg': cfg, 'sampler_name': 'dpmpp_2m', 'scheduler': 'karras', 'denoise': 0.45}}
        g['6']['inputs']['samples'] = ['9', 0]
    return g


def run(prompt, out, seed=1, w=512, h=768, n=1, steps=28, cfg=7.0, negative=NEGATIVE, pose=None, pose_strength=1.0, timeout=900, hires=0.0):
    os.makedirs(out, exist_ok=True)
    pose_name = upload(pose) if pose else None
    pid = post('/prompt', {'prompt': workflow(prompt, negative, seed, w, h, n, steps, cfg, pose_name, pose_strength, hires), 'client_id': 'be'})['prompt_id']
    t0 = time.time()
    while time.time() - t0 < timeout:
        hist = get('/history/' + pid)
        if pid in hist:
            st = hist[pid].get('status', {})
            if st.get('status_str') == 'error':
                raise RuntimeError(json.dumps(st)[:2000])
            files = []
            for node in hist[pid]['outputs'].values():
                for im in node.get('images', []):
                    q = urllib.parse.urlencode({'filename': im['filename'], 'subfolder': im['subfolder'], 'type': im['type']})
                    dst = os.path.join(out, 'seed%d_%s' % (seed, im['filename']))
                    with open(dst, 'wb') as fh:
                        fh.write(urllib.request.urlopen(HOST + '/view?' + q).read())
                    files.append(dst)
            meta = {'prompt': prompt, 'negative': negative, 'seed': seed, 'size': [w, h], 'steps': steps, 'cfg': cfg,
                    'checkpoint': CKPT, 'controlnet': CNET if pose else None, 'pose': pose, 'hires': hires, 'seconds': round(time.time() - t0, 1), 'files': files}
            with open(os.path.join(out, 'seed%d.json' % seed), 'w', encoding='utf8') as fh:
                json.dump(meta, fh, indent=1)
            return meta
        time.sleep(1)
    raise TimeoutError('ComfyUI did not finish in %ds' % timeout)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--prompt', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--seed', type=int, default=1); ap.add_argument('--n', type=int, default=1)
    ap.add_argument('--w', type=int, default=512); ap.add_argument('--h', type=int, default=768)
    ap.add_argument('--steps', type=int, default=28); ap.add_argument('--cfg', type=float, default=7.0)
    ap.add_argument('--pose'); ap.add_argument('--pose-strength', type=float, default=1.0)
    ap.add_argument('--hires', type=float, default=0.0, help='hires-fix scale, e.g. 1.5')
    a = ap.parse_args()
    print(json.dumps(run(a.prompt, a.out, a.seed, a.w, a.h, a.n, a.steps, a.cfg, pose=a.pose, pose_strength=a.pose_strength, hires=a.hires)))
