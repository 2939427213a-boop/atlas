import type { Env } from './env';
import { dailySalt, parseUa, persistAllowed, utcDay, visitorHash } from './visitor';

const MAX_BYTES = 32_768;
const MAX_EVENTS = 400;
const ID = /^[A-Za-z0-9_-]{8,40}$/;

export type Cf = {
  country?: string; region?: string; city?: string; timezone?: string; latitude?: string; longitude?: string;
  asn?: number; asOrganization?: string; colo?: string; httpProtocol?: string; clientTcpRtt?: number;
};

export interface Beacon {
  v: 1; pv: string; seq: number; fin?: boolean; path: string; lang?: string; page?: string; pver?: string; vid?: string;
  ms?: number; depth?: number; tp?: number; wd?: boolean; meta?: Record<string, unknown>; ev: unknown[];
}

const text = (x: unknown, max: number): string | null => (typeof x === 'string' ? x.slice(0, max) : null);
const int = (x: unknown, lo: number, hi: number): number | null =>
  typeof x === 'number' && Number.isFinite(x) ? Math.max(lo, Math.min(hi, Math.round(x))) : null;
const real = (x: unknown): number | null => {
  const n = Number(x);
  return x != null && Number.isFinite(n) ? n : null;
};

/** Workers serves foo.html at /foo and dir/index.html at dir/; count both spellings as one page. */
export function normalizePath(path: string): string {
  const p = path.slice(0, 300);
  if (p.endsWith('/index.html')) return p.slice(0, -'index.html'.length);
  if (p.endsWith('.html')) return p.slice(0, -'.html'.length);
  return p;
}

export function parseBeacon(body: string): Beacon | null {
  let b: Record<string, unknown>;
  try { b = JSON.parse(body); } catch { return null; }
  if (!b || typeof b !== 'object' || Array.isArray(b) || b.v !== 1 || typeof b.pv !== 'string' || !ID.test(b.pv)) return null;
  if (!Number.isInteger(b.seq) || (b.seq as number) < 0 || (b.seq as number) > 100_000) return null;
  if (typeof b.path !== 'string' || !b.path.startsWith('/') || !Array.isArray(b.ev)) return null;
  if (b.vid !== undefined && (typeof b.vid !== 'string' || !ID.test(b.vid))) delete b.vid;
  if (b.meta !== undefined && (typeof b.meta !== 'object' || b.meta === null || Array.isArray(b.meta))) delete b.meta;
  b.ev = (b.ev as unknown[]).slice(0, MAX_EVENTS);
  return b as unknown as Beacon;
}

/** Keep the stored context to what /privacy describes: no query strings, no opt-out flag. */
export function cleanMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const m: Record<string, unknown> = { ...meta };
  delete m.opt;
  if (typeof m.url === 'string') {
    const hash = m.url.indexOf('#');
    const path = (hash >= 0 ? m.url.slice(0, hash) : m.url).split('?')[0];
    m.url = path + (hash >= 0 ? m.url.slice(hash) : '');
  }
  if (typeof m.ref === 'string' && m.ref) {
    try { const u = new URL(m.ref); m.ref = u.origin + u.pathname; } catch { m.ref = ''; }
  }
  return m;
}

let cappedDay = '';

export function resetCapCache(): void {
  cappedDay = '';
}

function refHost(meta: Record<string, unknown> | undefined): string | null {
  const ref = text(meta?.ref, 500);
  if (!ref) return null;
  try { return new URL(ref).hostname || null; } catch { return null; }
}

export async function handleIngest(request: Request, env: Env, ctx: ExecutionContext, cf: Cf | undefined, now = Date.now()): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  const origin = request.headers.get('Origin');
  if (origin !== null && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  const site = request.headers.get('Sec-Fetch-Site');
  if (site !== null && site !== 'same-origin') return new Response(null, { status: 403 });
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BYTES) return new Response(null, { status: 413 });
  const body = await request.text();
  if (body.length > MAX_BYTES) return new Response(null, { status: 413 });
  const beacon = parseBeacon(body);
  if (!beacon) return new Response(null, { status: 400 });
  const persist = persistAllowed(cf?.country, request.headers);
  ctx.waitUntil(store(env, request, cf, beacon, persist, now, body.length).catch((err) => console.error('ingest store failed', String(err))));
  return Response.json({ p: persist ? 1 : 0 }, { headers: { 'Cache-Control': 'no-store' } });
}

async function store(env: Env, request: Request, cf: Cf | undefined, b: Beacon, persist: boolean, now: number, size: number): Promise<void> {
  const day = utcDay(now);
  if (cappedDay === day) return; // over the cap: no reads, no writes until the next UTC day
  const used = await env.DB.prepare('SELECT n, bytes FROM counters WHERE day = ?1').bind(day).first<{ n: number; bytes: number }>();
  if (used && (used.n >= Number(env.DAILY_BEACON_CAP || '10000') || used.bytes + size > Number(env.DAILY_BYTE_CAP || '30000000'))) {
    cappedDay = day;
    return;
  }
  const ua = request.headers.get('User-Agent') ?? '';
  const dvid = await visitorHash(await dailySalt(env.DB, day), request.headers.get('CF-Connecting-IP') ?? '', ua);
  const agent = parseUa(ua);
  const meta = b.seq === 0 ? cleanMeta(b.meta) : undefined;
  const metaJson = meta ? JSON.stringify(meta) : null;
  const device = agent.os === 'macOS' && (int(b.tp, 0, 20) ?? 0) > 1 ? 'tablet' : agent.device; // iPadOS reports macOS
  const clicks = b.ev.filter((e) => typeof e === 'object' && e !== null && (e as { k?: unknown }).k === 'c').length;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO counters (day, n, bytes) VALUES (?1, 1, ?2) ON CONFLICT(day) DO UPDATE SET n = n + 1, bytes = bytes + ?2')
      .bind(day, size),
    env.DB.prepare(`INSERT INTO beacons (received_at, day, schema, pv, seq, final, vid, dvid, path, lang, page, page_ver,
      active_ms, max_depth, n_events, n_clicks, ref_host, country, region, city, tz, lat, lon, asn, as_org, colo, http, rtt,
      ua, accept_lang, browser, os, device, bot, meta, events)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24,
      ?25, ?26, ?27, ?28, ?29, ?30, ?31, ?32, ?33, ?34, ?35, ?36)`)
    .bind(
      now, day, b.v, b.pv, b.seq, b.fin ? 1 : 0, persist ? (b.vid ?? null) : null, dvid, normalizePath(b.path),
      text(b.lang, 16), text(b.page, 120), text(b.pver, 40), int(b.ms, 0, 3_600_000) ?? 0, int(b.depth, 0, 100),
      b.ev.length, clicks, refHost(meta), cf?.country ?? null, cf?.region ?? null, cf?.city ?? null, cf?.timezone ?? null,
      real(cf?.latitude), real(cf?.longitude), cf?.asn ?? null, cf?.asOrganization ?? null, cf?.colo ?? null,
      cf?.httpProtocol ?? null, cf?.clientTcpRtt ?? null, ua.slice(0, 400), (request.headers.get('Accept-Language') ?? '').slice(0, 200),
      agent.browser, agent.os, device, agent.bot || b.wd === true ? 1 : 0,
      metaJson && metaJson.length <= 16_000 ? metaJson : null, JSON.stringify(b.ev),
    ),
  ]);
}
