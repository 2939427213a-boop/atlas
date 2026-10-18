import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { beforeAll, describe, expect, it } from 'vitest';
import { exportRows, parseRange, renderDashboard, sectionRank } from '../src/worker/admin';
import worker from '../src/worker/index';
import { handleIngest } from '../src/worker/ingest';

const ORIGIN = 'https://atlas.example.test';

async function ingest(body: Record<string, unknown>) {
  const ctx = createExecutionContext();
  await handleIngest(new Request(`${ORIGIN}/api/e`, {
    method: 'POST', body: JSON.stringify(body),
    headers: { Origin: ORIGIN, 'User-Agent': 'Mozilla/5.0 (Macintosh) Version/18.0 Safari/605.1.15', 'CF-Connecting-IP': '198.51.100.4' },
  }), env, ctx, { country: 'US', city: 'Boston' });
  await waitOnExecutionContext(ctx);
}
async function call(url: string, e: typeof env = env) {
  const ctx = createExecutionContext();
  const res = await worker.fetch(new Request(url), e, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

beforeAll(async () => {
  await env.DB.batch(['beacons', 'salts', 'counters'].map((t) => env.DB.prepare(`DELETE FROM ${t}`)));
  await ingest({
    v: 1, pv: 'aaaaaaaaaaaaaaaaaaaaaaaa', seq: 0, path: '/talks/x/', lang: 'en', ms: 9000, depth: 40, meta: { ref: 'https://x.com/a' },
    ev: [{ k: 'sec', id: 'hero', ms: 3000 }, { k: 'sec', id: 'ch-01', ms: 6000 }, { k: 'c', el: 'a#toc-fab', txt: 'Overview' },
      { k: 'cp', txt: 'model + tools in a loop' }, { k: 'sv', a: 'open', id: 'S07' }],
  });
  await ingest({ v: 1, pv: 'bbbbbbbbbbbbbbbbbbbbbbbb', seq: 0, path: '/talks/x/zh', lang: 'zh-CN', ms: 2000, depth: 5, ev: [{ k: 'sec', id: 'hero', ms: 2000 }] });
});

describe('dashboard', () => {
  it('renders totals, sections, clicks, copies, slides and referrers', async () => {
    const res = await renderDashboard(env, new URL(`${ORIGIN}/admin?days=30&path=/talks/x/`));
    const html = await res.text();
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    for (const s of ['ch-01', 'a#toc-fab', 'model + tools in a loop', 'S07', 'x.com']) expect(html).toContain(s);
  });
  it('orders sections the way the page reads', () => {
    expect(['summary', 'ch-10', 'hero', 'ch-02', 'contents'].sort((a, b) => sectionRank(a) - sectionRank(b)))
      .toEqual(['hero', 'contents', 'ch-02', 'ch-10', 'summary']);
  });
  it('loads the dashboard with at most three queries', async () => {
    let n = 0;
    const db = new Proxy(env.DB, {
      get(target, prop) {
        if (prop === 'prepare') return (sql: string) => { n++; return target.prepare(sql); };
        const v = Reflect.get(target, prop);
        return typeof v === 'function' ? v.bind(target) : v;
      },
    });
    const res = await renderDashboard({ ...env, DB: db }, new URL(`${ORIGIN}/admin?days=30`));
    expect(res.status).toBe(200);
    expect(n).toBeLessThanOrEqual(3);
  });
  it('caps the dashboard range at one year but lets the export go further back', () => {
    expect(parseRange(new URL(`${ORIGIN}/admin?days=3650`)).days).toBe(30);
    expect(parseRange(new URL(`${ORIGIN}/admin?days=365`)).days).toBe(365);
  });
  it('exports raw rows as NDJSON', async () => {
    const res = await exportRows(env, new URL(`${ORIGIN}/admin/export.ndjson?days=30`));
    const lines = (await res.text()).trim().split('\n').map((l) => JSON.parse(l));
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveProperty('events');
  });
});

describe('routing', () => {
  it('requires Access for /admin on the real host and fails closed without an AUD', async () => {
    expect((await call(`${ORIGIN}/admin`)).status).toBe(401);
    expect((await call(`${ORIGIN}/admin/export.ndjson`)).status).toBe(401);
    expect((await call(`${ORIGIN}/admin`, { ...env, ACCESS_AUD: '' })).status).toBe(503);
  });
  it('opens /admin on localhost only when DEV_ADMIN_OPEN is set', async () => {
    expect((await call('http://localhost:8787/admin', { ...env, DEV_ADMIN_OPEN: '1' })).status).toBe(200);
    expect((await call(`${ORIGIN}/admin`, { ...env, DEV_ADMIN_OPEN: '1' })).status).toBe(401);
  });
  it('routes /api/e to ingest and other API paths to 404', async () => {
    expect((await call(`${ORIGIN}/api/e`)).status).toBe(405);
    expect((await call(`${ORIGIN}/api/other`)).status).toBe(404);
  });
});
