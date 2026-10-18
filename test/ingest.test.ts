import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';
import { handleIngest, normalizePath, type Cf } from '../src/worker/ingest';
import { resetSaltCache } from '../src/worker/visitor';
import { resetCapCache } from '../src/worker/ingest';

const ORIGIN = 'https://atlas.example.test';
const SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const NOW = Date.UTC(2026, 9, 10, 15, 0, 0);
const DAY = 86_400_000;

function beacon(over: Record<string, unknown> = {}) {
  return {
    v: 1, pv: 'aaaaaaaaaaaaaaaaaaaaaaaa', seq: 0, fin: false, path: '/talks/x/index.html', lang: 'en', page: 'talks/x', pver: '2026-10-09',
    ms: 4000, depth: 12, tp: 0, wd: false, vid: 'bbbbbbbbbbbbbbbbbbbbbbbb',
    meta: { ref: 'https://x.com/leerob/status/1', vw: 1440 },
    ev: [{ k: 'c', t: 10, el: 'a#toc-fab' }, { k: 'sec', id: 'hero', ms: 4000, t: 4000 }],
    ...over,
  };
}
function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}/api/e`, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'text/plain', Origin: ORIGIN, 'User-Agent': SAFARI, 'CF-Connecting-IP': '203.0.113.7', ...headers },
  });
}
async function send(req: Request, cf: Cf = { country: 'US', region: 'New York', city: 'New York', asn: 7922 }, now = NOW) {
  const ctx = createExecutionContext();
  const res = await handleIngest(req, env, ctx, cf, now);
  await waitOnExecutionContext(ctx);
  return res;
}
const rows = async () => (await env.DB.prepare('SELECT * FROM beacons ORDER BY id').all<Record<string, unknown>>()).results;

beforeEach(async () => {
  resetSaltCache();
  resetCapCache();
  await env.DB.batch(['beacons', 'salts', 'counters'].map((t) => env.DB.prepare(`DELETE FROM ${t}`)));
});

describe('handleIngest', () => {
  it('stores one row with derived columns and allows a persistent id in the US', async () => {
    const res = await send(request(beacon()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ p: 1 });
    const [row] = await rows();
    expect(row).toMatchObject({
      path: '/talks/x/', vid: 'bbbbbbbbbbbbbbbbbbbbbbbb', country: 'US', city: 'New York', asn: 7922, browser: 'Safari', os: 'macOS',
      device: 'desktop', bot: 0, ref_host: 'x.com', active_ms: 4000, max_depth: 12, n_clicks: 1, n_events: 2, day: '2026-10-10',
    });
    expect(String(row.dvid)).toMatch(/^[0-9a-f]{16}$/);
    expect(JSON.stringify(row)).not.toContain('203.0.113.7');
  });

  it('drops the persistent id for an EEA visitor', async () => {
    const res = await send(request(beacon()), { country: 'DE' });
    expect(await res.json()).toEqual({ p: 0 });
    expect((await rows())[0].vid).toBeNull();
  });

  it('drops the persistent id when the browser sends GPC', async () => {
    const res = await send(request(beacon(), { 'Sec-GPC': '1' }));
    expect(await res.json()).toEqual({ p: 0 });
    expect((await rows())[0].vid).toBeNull();
  });

  it('rejects a cross-site origin', async () => {
    expect((await send(request(beacon(), { Origin: 'https://evil.example' }))).status).toBe(403);
    expect(await rows()).toHaveLength(0);
  });

  it('rejects malformed and oversized bodies', async () => {
    expect((await send(request('{not json'))).status).toBe(400);
    expect((await send(request(beacon({ pv: 'short' })))).status).toBe(400);
    expect((await send(request('x'.repeat(70_000)))).status).toBe(413);
    expect(await rows()).toHaveLength(0);
  });

  it('stops storing after the daily cap but still answers', async () => {
    for (let i = 0; i < 6; i++) expect((await send(request(beacon({ seq: i, meta: undefined })))).status).toBe(200);
    expect(await rows()).toHaveLength(5);
  });

  it('stops writing anything, the counter included, once the daily cap is reached', async () => {
    for (let i = 0; i < 8; i++) await send(request(beacon({ seq: i, meta: undefined })));
    const c = await env.DB.prepare('SELECT n FROM counters').first<{ n: number }>();
    expect(c?.n).toBe(5);
  });

  it('stops storing once the daily byte budget is used', async () => {
    const body = JSON.stringify(beacon({ meta: undefined }));
    const small = { ...env, DAILY_BYTE_CAP: String(body.length * 2 + 10) };
    for (let i = 0; i < 4; i++) {
      const ctx = createExecutionContext();
      await handleIngest(request(beacon({ seq: i, meta: undefined })), small, ctx, { country: 'US' }, NOW);
      await waitOnExecutionContext(ctx);
    }
    expect(await rows()).toHaveLength(2);
  });

  it('stores the page URL and referrer without query strings and drops the opt-out flag', async () => {
    await send(request(beacon({ meta: { url: '/talks/x/?utm_source=x&k=secret#ch-02', ref: 'https://www.google.com/search?q=atlas#top', opt: true } })));
    const [row] = await rows();
    expect(JSON.parse(String(row.meta))).toEqual({ url: '/talks/x/#ch-02', ref: 'https://www.google.com/search' });
    expect(row.ref_host).toBe('www.google.com');
  });

  it('flags bots by user agent or webdriver', async () => {
    await send(request(beacon(), { 'User-Agent': 'curl/8.7.1' }));
    await send(request(beacon({ pv: 'cccccccccccccccccccccccc', wd: true })));
    expect((await rows()).map((r) => r.bot)).toEqual([1, 1]);
  });

  it('keeps the visitor hash stable within a day and changes it the next day', async () => {
    await send(request(beacon()));
    await send(request(beacon({ seq: 1 })));
    await send(request(beacon({ seq: 2 })), undefined, NOW + DAY);
    const [a, b, c] = (await rows()).map((r) => r.dvid);
    expect(a).toBe(b);
    expect(c).not.toBe(a);
  });
});

describe('normalizePath', () => {
  it('maps file URLs to the clean URLs Workers serves', () => {
    expect(normalizePath('/talks/x/index.html')).toBe('/talks/x/');
    expect(normalizePath('/talks/x/zh.html')).toBe('/talks/x/zh');
    expect(normalizePath('/talks/x/zh')).toBe('/talks/x/zh');
    expect(normalizePath('/privacy.html')).toBe('/privacy');
  });
});
