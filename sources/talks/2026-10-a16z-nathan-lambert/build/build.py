"""Stitch zh.html / index.html from the senra reference page's CSS + viewer/JS tail.
Usage: python3 -I build.py zh|en
"""
import sys, pathlib
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
REF = ROOT / "public/talks/2026-10-senra-alexandr-wang"
SLUG = "2026-10-a16z-nathan-lambert"
BASE = f"https://atlas.haoli-agi.com/talks/{SLUG}/"
DATA_V = "2026-10-17"

META = {
  "zh": dict(
    ref="zh.html", out="zh.html", lang="zh-CN", body="zh_body.html",
    comment="Nathan Lambert on open models · a16z · 2026-10-14 — Chinese study notes.",
    title="Nathan Lambert on open models · a16z",
    desc="a16z 访谈 Nathan Lambert 的学习笔记：前沿实验室的领先从哪来，中国开源模型为什么只差几个月，蒸馏、RL 环境和数据生意怎样运作，以及 Trillium Labs 为什么要公开 AI 做 AI 研究的全过程。",
    og_title="Nathan Lambert：开源模型追得上前沿吗 · 学习笔记",
    url=BASE + "zh", locale="zh_CN",
    alt="访谈画面：Lisha Li 和 Nathan Lambert 隔着圆桌相对而坐",
    switch='<nav class="lang-switch" id="lang-switch" aria-label="语言 / Language"><a href="./" hreflang="en" lang="en">EN</a><a href="zh.html" hreflang="zh-CN" lang="zh-CN" aria-current="page">中</a></nav>'),
  "en": dict(
    ref="index.html", out="index.html", lang="en", body="en_body.html",
    comment="Nathan Lambert on open models · a16z · 2026-10-14 — study notes.",
    title="Nathan Lambert on open models · a16z",
    desc="Study notes on a16z's interview with Nathan Lambert: where the frontier labs' lead comes from, why Chinese open models trail by only months, how distillation, RL environments and the data business work, and why Trillium Labs will open-source how AI does AI research.",
    og_title="Nathan Lambert: can open models keep up? · Study notes",
    url=BASE, locale="en_US",
    alt="Interview still: Lisha Li and Nathan Lambert seated across a round table",
    switch='<nav class="lang-switch" id="lang-switch" aria-label="Language / 语言"><a href="./" hreflang="en" lang="en" aria-current="page">EN</a><a href="zh.html" hreflang="zh-CN" lang="zh-CN">中</a></nav>'),
}

def main(lang):
    m = META[lang]
    ref = (REF / m["ref"]).read_text().splitlines(keepends=True)
    s0 = next(i for i, l in enumerate(ref) if l.startswith("<style>"))
    s1 = next(i for i, l in enumerate(ref) if l.startswith("</style>"))
    t0 = next(i for i, l in enumerate(ref) if l.startswith('<div class="sv" id="sv"'))
    css = "".join(ref[s0 + 1:s1])
    tail = "".join(ref[t0:])
    extra = (HERE / "extra.css").read_text()
    body = (HERE / m["body"]).read_text()
    head = f"""<!doctype html>
<!--
  {m['comment']}
  Visual style inspired by and adapted from Nous Research's Hermes / LENS design language
  (@nous-research/ui, MIT License). Not affiliated with Nous Research. See NOTICE.txt.
  Fonts: Unbounded, Instrument Serif, JetBrains Mono, Noto Sans SC (SIL OFL 1.1, via Google Fonts).
-->
<html lang="{m['lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{m['title']}</title>
<meta name="description" content="{m['desc']}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Atlas">
<meta property="og:title" content="{m['og_title']}">
<meta property="og:description" content="{m['desc']}">
<meta property="og:url" content="{m['url']}">
<meta property="og:locale" content="{m['locale']}">
<meta property="og:image" content="{BASE}assets/cover.jpg">
<meta property="og:image:width" content="1920">
<meta property="og:image:height" content="1080">
<meta property="og:image:alt" content="{m['alt']}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@steamedbun1111">
<link rel="canonical" href="{m['url']}">
<link rel="alternate" hreflang="en" href="{BASE}">
<link rel="alternate" hreflang="zh-CN" href="{BASE}zh">
<link rel="alternate" hreflang="x-default" href="{BASE}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;700&family=Noto+Sans+SC:wght@400;500;700;900&family=Unbounded:wght@400;700&display=swap" rel="stylesheet">
<style>
"""
    out = (head + css + extra + "</style>\n"
           + f'<script src="/assets/atlas.js" defer data-page="talks/{SLUG}" data-v="{DATA_V}"></script>\n'
           + "</head>\n<body>\n\n" + m["switch"] + "\n\n"
           + '<div class="hermes-bg" aria-hidden="true"><div class="bg-l1"></div><img class="bg-l2" src="assets/hermes/filler-bg0.webp" alt=""><div class="bg-l99"></div><div class="bg-l201"></div></div>\n\n'
           + body + "\n" + tail)
    dst = HERE.parent / "deliverable" / m["out"]
    dst.write_text(out)
    print(dst, len(out))

if __name__ == "__main__":
    main(sys.argv[1])
