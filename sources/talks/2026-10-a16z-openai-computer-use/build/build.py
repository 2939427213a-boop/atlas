"""Stitch zh.html / index.html from the alex-zhang reference page's CSS + viewer/JS tail.
Footnotes: write {{fn:key}} in the body and {{srcs}} inside ol.srcs; keys live in sources.json
and are numbered by first appearance in zh_body.html, so both languages share the numbers.
Usage: python3 -I build.py zh|en
"""
import sys, pathlib, json, re
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
REF = ROOT / "public/talks/2026-10-latent-space-alex-zhang"
SLUG = "2026-10-a16z-openai-computer-use"
BASE = f"https://atlas.haoli-agi.com/talks/{SLUG}/"
DATA_V = "2026-10-27"

META = {
  "zh": dict(
    ref="zh.html", out="zh.html", lang="zh-CN", body="zh_body.html",
    comment="Superhuman computer use · a16z Podcast with OpenAI's Ari Weinstein and James Sun · 2026-10-26 — Chinese study notes.",
    title="Superhuman computer use：OpenAI 的 Ari Weinstein 和 James Sun · a16z Podcast",
    desc="a16z Podcast 访谈 OpenAI 的 Ari Weinstein 和 James Sun 的学习笔记：GPT‑6 Astra 给 computer use 带来了什么，企业怎样才敢放手，为什么最好的用例很无聊，界面为什么不会消失，以及用户为什么会有四个互不相通的浏览器。",
    og_title="Superhuman computer use：像人一样用电脑，然后比人快 · 学习笔记",
    url=BASE + "zh", locale="zh_CN",
    alt="访谈画面：左边 Seema Amble、Ari Weinstein、James Sun 围坐圆桌，右边 Fabrizio Serafini 远程连线",
    switch='<nav class="lang-switch" id="lang-switch" aria-label="语言 / Language"><a href="./" hreflang="en" lang="en">EN</a><a href="zh.html" hreflang="zh-CN" lang="zh-CN" aria-current="page">中</a></nav>'),
  "en": dict(
    ref="index.html", out="index.html", lang="en", body="en_body.html",
    comment="Superhuman computer use · a16z Podcast with OpenAI's Ari Weinstein and James Sun · 2026-10-26 — study notes.",
    title="Superhuman computer use: OpenAI's Ari Weinstein and James Sun · a16z Podcast",
    desc="Study notes on the a16z Podcast with OpenAI's Ari Weinstein and James Sun: what GPT‑6 Astra changed for computer use, what it takes for enterprises to let agents act, why the best use cases are the boring ones, why UI isn't going away, and why users end up with four browsers that don't talk to each other.",
    og_title="Superhuman computer use: use a computer like a person, then faster · Study notes",
    url=BASE, locale="en_US",
    alt="Interview still: Seema Amble, Ari Weinstein and James Sun at a round table; Fabrizio Serafini joins remotely on the right",
    switch='<nav class="lang-switch" id="lang-switch" aria-label="Language / 语言"><a href="./" hreflang="en" lang="en" aria-current="page">EN</a><a href="zh.html" hreflang="zh-CN" lang="zh-CN">中</a></nav>'),
}

FN = re.compile(r"\{\{fn:([\w-]+)\}\}")
LBL = {"zh": "来源", "en": "Source"}

def keys(text):
    seen = []
    for k in FN.findall(text):
        if k not in seen:
            seen.append(k)
    return seen

def resolve(body, lang):
    src = json.loads((HERE / "sources.json").read_text())
    order = keys((HERE / "zh_body.html").read_text())
    order += [k for k in keys(body) if k not in order]
    def anchors(run):
        return "".join(f'<a class="fn" href="#src-{order.index(k) + 1}" aria-label="{LBL[lang]} {order.index(k) + 1}">{order.index(k) + 1}</a>'
                       for k in FN.findall(run))
    def repl(mt):  # keep the last 1-2 characters on the footnote's line
        pre, a = mt.group(1) or "", anchors(mt.group(2))
        return f'<span class="nb">{pre}{a}</span>' if pre else a
    body = re.sub(r"([^\s<>;&]{1,2})?((?:\{\{fn:[\w-]+\}\})+)", repl, body)
    lis = "\n".join(f'      <li id="src-{i}"><a href="{src[k]["url"]}" rel="noopener">{src[k][lang]}</a></li>'
                    for i, k in enumerate(order, 1))
    body = body.replace("{{srcs}}", lis)
    left = re.findall(r"\{\{[^}]*\}\}", body)
    assert not left, f"unresolved placeholders: {left}"
    return body

def main(lang):
    m = META[lang]
    ref = (REF / m["ref"]).read_text().splitlines(keepends=True)
    s0 = next(i for i, l in enumerate(ref) if l.startswith("<style>"))
    s1 = next(i for i, l in enumerate(ref) if l.startswith("</style>"))
    t0 = next(i for i, l in enumerate(ref) if l.startswith('<div class="sv" id="sv"'))
    css = "".join(ref[s0 + 1:s1])
    tail = "".join(ref[t0:])
    extra = (HERE / "extra.css").read_text()
    body = resolve((HERE / m["body"]).read_text(), lang)
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
