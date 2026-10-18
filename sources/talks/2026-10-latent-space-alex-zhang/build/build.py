"""Stitch zh.html / index.html from the senra reference page's CSS + viewer/JS tail.
Usage: python3 -I build.py zh|en
"""
import sys, pathlib
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
REF = ROOT / "public/talks/2026-10-senra-alexandr-wang"
SLUG = "2026-10-latent-space-alex-zhang"
BASE = f"https://atlas.haoli-agi.com/talks/{SLUG}/"
DATA_V = "2026-10-18"

META = {
  "zh": dict(
    ref="zh.html", out="zh.html", lang="zh-CN", body="zh_body.html",
    comment="Alex Zhang on Recursive Language Models · Latent Space · 2026-10-02 — Chinese study notes.",
    title="Alex Zhang on Recursive Language Models · Latent Space",
    desc="Latent Space 访谈 Alex Zhang 的学习笔记：主流 harness 为什么大同小异，Recursive Language Models 怎样把上下文放进代码环境、换来组合泛化，agent swarm 的浪费和收敛，以及学术界该押什么样的怪注。",
    og_title="Alex Zhang：模型够聪明了，缺的是更好的 harness · 学习笔记",
    url=BASE + "zh", locale="zh_CN",
    alt="访谈画面：Alex Zhang 坐在麦克风前",
    switch='<nav class="lang-switch" id="lang-switch" aria-label="语言 / Language"><a href="./" hreflang="en" lang="en">EN</a><a href="zh.html" hreflang="zh-CN" lang="zh-CN" aria-current="page">中</a></nav>'),
  "en": dict(
    ref="index.html", out="index.html", lang="en", body="en_body.html",
    comment="Alex Zhang on Recursive Language Models · Latent Space · 2026-10-02 — study notes.",
    title="Alex Zhang on Recursive Language Models · Latent Space",
    desc="Study notes on Latent Space's interview with Alex Zhang: why mainstream harnesses are nearly identical, how Recursive Language Models keep context in a code environment to generalize compositionally, the waste and convergence of agent swarms, and the odd bets academia should make.",
    og_title="Alex Zhang: models are smart enough, harnesses are not · Study notes",
    url=BASE, locale="en_US",
    alt="Interview still: Alex Zhang at the microphone",
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
    # drop the reference page's own widgets (its #v04 launch gate, #v12 dots); this page has a different #v04
    i, j = tail.index("/* 04 · launch gate"), tail.index("/* in-page image viewer")
    tail = tail[:i] + tail[j:]
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
