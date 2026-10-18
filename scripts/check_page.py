#!/usr/bin/env python3
"""Structural checks for the study page.
python3 scripts/check_page.py deliverable/index.html [work/slides.json]
Chapters are #ch-00, #ch-01, ... with no gaps; any count. Without slides.json the slide check is skipped.
Under public/talks/<slug>/ every talks/... reference in <head> (canonical, hreflang, og, data-page) must be <slug>."""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class Collect(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.hrefs, self.srcs = [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.append(a["id"])
        if tag == "a" and a.get("href"):
            self.hrefs.append(a["href"])
        if tag == "img" and a.get("src"):
            self.srcs.append(a["src"])


def exists(root, site, ref):
    """Resolve a page-relative or site-absolute link the way Workers static assets serves it."""
    path = ref.split("#", 1)[0].split("?", 1)[0]
    if not path:
        return True
    p = (site / path.lstrip("/")) if path.startswith("/") else (root / path)
    return any(c.exists() for c in (p, p.with_name(p.name + ".html"), p / "index.html"))


def main(page, slides_json=None):
    root = Path(page).parent
    html = Path(page).read_text(encoding="utf-8")
    c = Collect()
    c.feed(html)
    ids = set(c.ids)
    errors = []
    dup = sorted({i for i in c.ids if c.ids.count(i) > 1})
    if dup:
        errors.append(f"duplicate ids {dup}")
    site = next((d for d in Path(page).resolve().parents if d.name == "public"), root)
    for h in c.hrefs:
        if h.startswith("#"):
            if h[1:] and h[1:] not in ids:
                errors.append(f"broken anchor {h}")
        elif not re.match(r"^(https?:|mailto:)", h) and not exists(root, site, h):
            errors.append(f"missing file {h}")
    for s in c.srcs:
        if not s.startswith(("http", "data:")) and not exists(root, site, s):
            errors.append(f"missing img {s}")
    if slides_json:
        used = {Path(x).name for x in c.srcs + c.hrefs}
        for s in json.loads(Path(slides_json).read_text()):
            if Path(s["file"]).name not in used:
                errors.append(f"slide not referenced {s['file']}")
    chapters = sorted(int(i[3:]) for i in ids if re.fullmatch(r"ch-\d\d", i))
    if not chapters:
        errors.append("no chapters (#ch-00 ...)")
    for n in sorted(set(range(chapters[-1] + 1)) - set(chapters) if chapters else []):
        errors.append(f"missing #ch-{n:02d} (chapters must run from #ch-00 without gaps)")
    for need in ["contents", "toc-fab", "summary", "glossary"]:
        if need not in ids:
            errors.append(f"missing #{need}")
    if not re.search(r"#toc-fab\s*\{[^}]*position:\s*fixed", html):
        errors.append("#toc-fab is not position:fixed")
    here = Path(page).resolve()
    if here.parent.parent.name == "talks" and here.parent.parent.parent.name == "public":
        slug = here.parent.name
        for other in sorted(set(re.findall(r"talks/([\w-]+)", html.split("</head>", 1)[0])) - {slug}):
            errors.append(f"<head> still points at talks/{other} (this page is talks/{slug})")
    print("\n".join(errors) or "OK")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:3]))
