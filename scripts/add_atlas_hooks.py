#!/usr/bin/env python3
"""Add the atlas statistics script and the footer privacy note to a study page. Safe to run twice:
on a page that is already hooked (e.g. one copied from the template) it only resets data-page and data-v,
the page id and version the stats are filed under.
python3 -I scripts/add_atlas_hooks.py public/talks/<slug>/index.html talks/<slug> 2026-10-09"""
import re
import sys
from pathlib import Path

NOTE = {
    "en": '<p class="privacy-note">This site records reading statistics without cookies or stored IP addresses. '
          '<a href="/privacy">Privacy note</a></p>',
    "zh": '<p class="privacy-note">本站记录阅读统计，不用 cookie，不保存原始 IP。<a href="/privacy#zh">隐私说明</a></p>',
}
CSS = ".credit .privacy-note{font-family:var(--font-mono);font-size:11px}\n"
ANCHOR = "/* ===== language switch ===== */"


def main(page, page_id, version):
    p = Path(page)
    t = p.read_text(encoding="utf-8")
    if "/assets/atlas.js" in t:
        def retag(m):
            tag = re.sub(r'\bdata-page="[^"]*"', lambda _: f'data-page="{page_id}"', m.group(0))
            return re.sub(r'\bdata-v="[^"]*"', lambda _: f'data-v="{version}"', tag)
        new = re.sub(r'<script src="/assets/atlas\.js"[^>]*>', retag, t, count=1)
        if new != t:
            p.write_text(new, encoding="utf-8")
        print("already hooked", p, "data-page", page_id, "data-v", version)
        return 0
    lang = "zh" if '<html lang="zh' in t else "en"
    assert t.count("</head>") == 1 and t.count(ANCHOR) == 1 and t.count('id="credits"') == 1, p
    t = t.replace("</head>", f'<script src="/assets/atlas.js" defer data-page="{page_id}" data-v="{version}"></script>\n</head>')
    t = t.replace(ANCHOR, CSS + ANCHOR)
    i = t.index('id="credits"')
    j = t.index("</section>", i)
    t = t[:j] + "  " + NOTE[lang] + "\n  " + t[j:]
    p.write_text(t, encoding="utf-8")
    print("hooked", p, lang)
    return 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:4]))
