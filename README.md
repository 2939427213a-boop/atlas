# Atlas

Talks and articles worth keeping, distilled into study pages (English and Chinese).
值得留下的讲座与文章，整理成中英双语学习页。

Live site: https://atlas.haoli-agi.com

## What is here

- `public/` — the static site: home page, privacy page, and one folder per talk under `public/talks/<slug>/`.
- `src/worker/` — a Cloudflare Worker. It serves the static files, receives page analytics at `/api/e`, and shows a dashboard at `/admin` (behind Cloudflare Access).
- `migrations/` — the D1 schema. `test/` — Vitest tests that run in the Workers runtime.
- `sources/` — working notes used to build the talk pages. Transcripts are not published.
- `scripts/` — page checks and the deploy script.

## Analytics and privacy

The site counts reading behaviour (sections reached, time per section, clicks) without cookies and without storing IP addresses. Visitors are de-duplicated with a daily salted hash that is deleted the next day. Visitors from the EU/EEA, the UK and Switzerland, and visitors who send GPC or DNT, get no stored visitor ID. Details: [privacy page](https://atlas.haoli-agi.com/privacy).

## Run it locally

```bash
bun install
./node_modules/.bin/wrangler d1 migrations apply atlas --local
bun run dev
```

`bun run check` runs the page checks, type check and tests.

## Licence

Code is MIT. The study pages, notes and all third-party images are not. See [LICENSE](LICENSE).
