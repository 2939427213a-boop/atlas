"""Build the Atlas favicon ("nebula star map", deeper green) from one scene description.

Writes:
  sources/favicon/atlas-icon.svg   vector reference of the same scene
  public/favicon.ico               16/32/48 px, rounded tile
  public/apple-touch-icon.png      180 px, square tile (iOS rounds it)

Run from the repo root: python3 -I sources/favicon/build_icons.py
Needs numpy + Pillow. Rasterizes with supersampling, so no SVG renderer is required.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
GRID = 32      # the scene is drawn on a 32×32 grid
TILE_RX = 7    # corner radius of the tab icon

# (cx, cy, r, [(offset, (r, g, b), alpha), ...])
SPACE = (22, 7, 36, [(0, (0x10, 0x3f, 0x3a), 1), (.45, (0x06, 0x24, 0x24), 1), (1, (0x02, 0x0b, 0x0b), 1)])
# Nebula clouds: (cx, cy, r, rgb, alpha); each fades to 45 % at half radius, 0 at the edge.
CLOUDS = [
    (21, 11, 15, (22, 105, 65), .7),     # green
    (9, 21, 12, (20, 85, 95), .55),      # teal
    (24, 25, 9, (207, 124, 96), .45),    # terracotta
    (14, 14, 7, (255, 230, 203), .12),   # cream haze
]
LINES = [((7, 8), (14, 15)), ((14, 15), (23.5, 9.5)), ((14, 15), (22, 24))]
LINE_RGB, LINE_ALPHA, LINE_WIDTH = (255, 230, 203), .6, 1
# Stars: (cx, cy, r, alpha); each has a soft glow of radius 3r.
STARS = [(7, 8, 1.6, 1), (14, 15, 2, 1), (23.5, 9.5, 1.7, 1), (22, 24, 1.5, 1),
         (27, 15, .6, .7), (5, 24, .6, .6), (11, 27, .5, .6)]
STAR_RGB = (255, 240, 220)


def cloud_stops(rgb, a):
    return [(0, rgb, a), (.5, rgb, a * .45), (1, rgb, 0)]


def glow_stops(a):
    return [(0, STAR_RGB, .35 * a), (1, STAR_RGB, 0)]


# ---------- raster ----------

def radial(x, y, cx, cy, r, stops):
    t = np.clip(np.hypot(x - cx, y - cy) / r, 0, 1)
    offs = [s[0] for s in stops]
    rgb = np.stack([np.interp(t, offs, [s[1][i] for s in stops]) for i in range(3)], -1) / 255
    return rgb, np.interp(t, offs, [s[2] for s in stops])


def seg_dist(x, y, p, q):
    (px, py), (qx, qy) = p, q
    dx, dy = qx - px, qy - py
    t = np.clip(((x - px) * dx + (y - py) * dy) / (dx * dx + dy * dy), 0, 1)
    return np.hypot(x - (px + t * dx), y - (py + t * dy))


def rounded_rect(x, y, rx):
    if rx == 0:
        return np.ones_like(x)
    cx = np.clip(x, rx, GRID - rx)
    cy = np.clip(y, rx, GRID - rx)
    return (np.hypot(x - cx, y - cy) <= rx).astype(float)


def render(size, rx, ss):
    n = size * ss
    c = (np.arange(n) + .5) / n * GRID
    x, y = np.meshgrid(c, c)
    out = np.zeros((n, n, 4))  # premultiplied RGBA

    def over(rgb, a):
        out[..., :3] = rgb * a[..., None] + out[..., :3] * (1 - a[..., None])
        out[..., 3] = a + out[..., 3] * (1 - a)

    def disc(cx, cy, r):
        return (np.hypot(x - cx, y - cy) <= r).astype(float)

    over(*radial(x, y, *SPACE))
    for cx, cy, r, rgb, a in CLOUDS:
        col, al = radial(x, y, cx, cy, r, cloud_stops(rgb, a))
        over(col, al * disc(cx, cy, r))
    line = np.zeros_like(x)
    for p, q in LINES:
        line = np.maximum(line, (seg_dist(x, y, p, q) <= LINE_WIDTH / 2).astype(float))
    over(np.broadcast_to(np.array(LINE_RGB) / 255, x.shape + (3,)), LINE_ALPHA * line)
    for cx, cy, r, a in STARS:
        col, al = radial(x, y, cx, cy, r * 3, glow_stops(a))
        over(col, al * disc(cx, cy, r * 3))
        over(np.broadcast_to(np.array(STAR_RGB) / 255, x.shape + (3,)), a * disc(cx, cy, r))

    out *= rounded_rect(x, y, rx)[..., None]
    out = out.reshape(size, ss, size, ss, 4).mean((1, 3))  # box-filter downsample
    alpha = out[..., 3:]
    rgb = np.where(alpha > 0, out[..., :3] / np.maximum(alpha, 1e-9), 0)
    px = np.concatenate([rgb, alpha], -1)
    return Image.fromarray(np.round(px * 255).astype(np.uint8), "RGBA")


# ---------- svg ----------

def svg():
    defs, body = [], []

    def grad(gid, cx, cy, r, stops):
        s = "".join(f'<stop offset="{o:g}" stop-color="rgb{tuple(c)}" stop-opacity="{a:.3g}"/>' for o, c, a in stops)
        defs.append(f'<radialGradient id="{gid}" gradientUnits="userSpaceOnUse" cx="{cx}" cy="{cy}" r="{r}">{s}</radialGradient>')

    grad("space", *SPACE)
    body.append(f'<rect width="{GRID}" height="{GRID}" fill="url(#space)"/>')
    for i, (cx, cy, r, rgb, a) in enumerate(CLOUDS):
        grad(f"c{i}", cx, cy, r, cloud_stops(rgb, a))
        body.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#c{i})"/>')
    d = "".join(f"M{p[0]} {p[1]}L{q[0]} {q[1]}" for p, q in LINES)
    body.append(f'<path d="{d}" fill="none" stroke="rgb{LINE_RGB}" stroke-opacity="{LINE_ALPHA}" '
                f'stroke-width="{LINE_WIDTH}" stroke-linecap="round"/>')
    for i, (cx, cy, r, a) in enumerate(STARS):
        grad(f"s{i}", cx, cy, r * 3, glow_stops(a))
        body.append(f'<circle cx="{cx}" cy="{cy}" r="{r * 3:g}" fill="url(#s{i})"/>')
        body.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="rgb{STAR_RGB}" fill-opacity="{a}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {GRID} {GRID}">\n'
            "<!-- Atlas favicon (nebula star map, deeper green). Generated by build_icons.py; edit the script, not this file. -->\n"
            f'<defs>{"".join(defs)}<clipPath id="tile"><rect width="{GRID}" height="{GRID}" rx="{TILE_RX}"/></clipPath></defs>\n'
            '<g clip-path="url(#tile)">\n' + "\n".join(body) + "\n</g>\n</svg>\n")


def main():
    (ROOT / "sources/favicon/atlas-icon.svg").write_text(svg())
    ico = [render(s, TILE_RX, 8) for s in (48, 32, 16)]
    ico[0].save(ROOT / "public/favicon.ico", sizes=[(48, 48), (32, 32), (16, 16)], append_images=ico[1:])
    render(180, 0, 4).convert("RGB").save(ROOT / "public/apple-touch-icon.png", optimize=True)
    for f in ("public/favicon.ico", "public/apple-touch-icon.png", "sources/favicon/atlas-icon.svg"):
        print(f, (ROOT / f).stat().st_size, "bytes")


if __name__ == "__main__":
    main()
