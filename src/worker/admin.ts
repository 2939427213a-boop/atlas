import type { Env } from './env';

type Row = Record<string, unknown>;
const DAY = 86_400_000;
const DASHBOARD_RANGES = [1, 7, 30, 90, 365];
const EXPORT_RANGES = [...DASHBOARD_RANGES, 3650];

export function etOffsetMinutes(at = new Date()): number {
  const s = at.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' });
  const m = /GMT([+-]\d+)/.exec(s);
  return m ? Number(m[1]) * 60 : -300;
}

export function sectionRank(id: string): number {
  if (id === 'hero') return 0;
  if (id === 'contents') return 1;
  const m = /^ch-(\d+)$/.exec(id);
  if (m) return 2 + Number(m[1]) / 1000;
  return ({ summary: 3, glossary: 4, credits: 5 } as Record<string, number>)[id] ?? 6;
}

export interface Range { days: number; path: string | null; since: number; off: number }

export function parseRange(url: URL, now = Date.now(), allowed = DASHBOARD_RANGES): Range {
  const d = Number(url.searchParams.get('days') ?? '30');
  const days = allowed.includes(d) ? d : 30;
  const p = url.searchParams.get('path');
  return { days, path: p && p.startsWith('/') ? p.slice(0, 300) : null, since: now - days * DAY, off: etOffsetMinutes(new Date(now)) };
}

// One row per page load. ?1 = since (ms), ?2 = path filter or NULL.
const PVS = `SELECT pv, MIN(received_at) AS t0, MAX(path) AS path, MAX(lang) AS lang, MAX(country) AS country, MAX(city) AS city,
    MAX(vid) AS vid, MAX(dvid) AS dvid, MAX(day) AS day, SUM(active_ms) AS ms, MAX(max_depth) AS depth,
    SUM(n_clicks) AS clicks, MAX(ref_host) AS ref, MAX(device) AS device, MAX(browser) AS browser, MAX(os) AS os
  FROM beacons WHERE received_at >= ?1 AND bot = 0 AND (?2 IS NULL OR path = ?2) GROUP BY pv LIMIT 100000`;

// Click, copy and slide-viewer events in one pass. eid avoids json_each's own id column.
const EVENTS = `SELECT json_extract(e.value, '$.k') AS k, json_extract(e.value, '$.el') AS el, json_extract(e.value, '$.txt') AS txt,
    json_extract(e.value, '$.href') AS href, json_extract(e.value, '$.id') AS eid, json_extract(e.value, '$.a') AS act
  FROM beacons b, json_each(b.events) e WHERE b.received_at >= ?1 AND b.bot = 0 AND (?2 IS NULL OR b.path = ?2)
  AND json_extract(e.value, '$.k') IN ('c', 'cp', 'sv') LIMIT 100000`;

const DIMENSIONS: Record<string, string> = {
  ref: '来源', country: '国家/地区', city: '城市', device: '设备', browser: '浏览器', os: '系统', lang: '语言版本', path: '页面',
};

async function all(env: Env, sql: string, ...params: unknown[]): Promise<Row[]> {
  return (await env.DB.prepare(sql).bind(...params).all<Row>()).results;
}

/** Count rows by a key; returns the top entries as { [name]: key, n, avg_ms? }. */
function tally(rows: Row[], key: (r: Row) => unknown, name: string, limit: number, withMs = false): Row[] {
  const m = new Map<string, { n: number; ms: number }>();
  for (const r of rows) {
    const k = String(key(r) ?? '(none)');
    const v = m.get(k) ?? { n: 0, ms: 0 };
    v.n++;
    v.ms += Number(r.ms ?? 0);
    m.set(k, v);
  }
  return [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, limit)
    .map(([k, v]) => (withMs ? { [name]: k, n: v.n, avg_ms: Math.round(v.ms / v.n) } : { [name]: k, n: v.n }));
}

export async function collect(env: Env, r: Range) {
  const pvs = await all(env, PVS, r.since, r.path);
  const local = (t0: unknown) => new Date(Number(t0) + r.off * 60_000).toISOString();
  const avg = (rows: Row[]) => (rows.length ? Math.round(rows.reduce((s, x) => s + Number(x.ms ?? 0), 0) / rows.length) : 0);

  const vidDays = new Map<string, Set<string>>();
  for (const x of pvs) if (x.vid) (vidDays.get(String(x.vid)) ?? vidDays.set(String(x.vid), new Set()).get(String(x.vid))!).add(String(x.day));
  const totals: Row = {
    pvs: pvs.length,
    visitor_days: new Set(pvs.map((x) => `${x.day}|${x.dvid}`)).size,
    ids: vidDays.size,
    avg_ms: avg(pvs),
    deep: pvs.filter((x) => Number(x.depth ?? 0) >= 90).length,
  };
  const returning = [...vidDays.values()].filter((days) => days.size > 1).length;

  const byDay = new Map<string, Row[]>();
  for (const x of pvs) { const d = local(x.t0).slice(0, 10); (byDay.get(d) ?? byDay.set(d, []).get(d)!).push(x); }
  const daily = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([d, rows]) => ({ d, pvs: rows.length, visitors: new Set(rows.map((x) => x.dvid)).size, avg_ms: avg(rows) }));
  const hourCount = new Map<number, number>();
  for (const x of pvs) { const h = Number(local(x.t0).slice(11, 13)); hourCount.set(h, (hourCount.get(h) ?? 0) + 1); }
  const hours = [...hourCount.entries()].map(([h, n]) => ({ h, n }));

  const dims: Record<string, Row[]> = {};
  for (const col of Object.keys(DIMENSIONS)) dims[col] = tally(pvs, (x) => x[col], 'k', 15, true);

  const topPath = r.path ?? ((dims.path[0]?.k as string | undefined) ?? null);
  const sections = topPath
    ? (await all(env, `SELECT json_extract(e.value, '$.id') AS sec, SUM(json_extract(e.value, '$.ms')) AS ms, COUNT(DISTINCT b.pv) AS readers
        FROM beacons b, json_each(b.events) e WHERE b.received_at >= ?1 AND b.bot = 0 AND b.path = ?2
        AND json_extract(e.value, '$.k') = 'sec' GROUP BY sec`, r.since, topPath))
        .sort((a, b) => sectionRank(String(a.sec)) - sectionRank(String(b.sec)))
    : [];
  const pathPvs = topPath ? pvs.filter((x) => x.path === topPath).length : 0;

  const ev = await all(env, EVENTS, r.since, r.path);
  const clickRows = ev.filter((e) => e.k === 'c');
  const clicks = tally(clickRows, (e) => `${e.el ?? ''}\u0000${e.txt ?? ''}`, 'key', 25)
    .map((x) => { const [el, txt] = String(x.key).split('\u0000'); return { el, txt, n: x.n }; });
  const outbound = tally(clickRows.filter((e) => /^https?:/.test(String(e.href ?? ''))), (e) => e.href, 'href', 25);
  const copies = tally(ev.filter((e) => e.k === 'cp'), (e) => e.txt, 'txt', 25);
  const slides = tally(ev.filter((e) => e.k === 'sv' && (e.act === 'open' || e.act === 'go')), (e) => e.eid, 'slide', 25);
  const recent = [...pvs].sort((a, b) => Number(b.t0) - Number(a.t0)).slice(0, 50);

  return { totals, returning, daily, hours, dims, topPath, sections, pathPvs, clicks, outbound, copies, slides, recent };
}

type Data = Awaited<ReturnType<typeof collect>>;

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const secs = (ms: unknown) => {
  const s = Math.round(Number(ms ?? 0) / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s` : `${s}s`;
};
const bar = (v: number, max: number) => `<span class="track"><span class="bar" style="width:${max ? Math.round((v / max) * 100) : 0}%"></span></span>`;
const card = (label: string, v: unknown) => `<div class="card"><b>${esc(v ?? 0)}</b><span>${esc(label)}</span></div>`;

function table(title: string, head: string[], rows: string[][]): string {
  const body = rows.length
    ? rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${head.length}" class="empty">暂无数据</td></tr>`;
  return `<section><h2>${esc(title)}</h2><table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></section>`;
}

const CSS = `:root{color-scheme:dark;--bg:#041c1c;--fg:#ffe6cb;--mute:#ffe6cb99;--line:#ffe6cb26}
*{box-sizing:border-box}body{margin:0;padding:24px 16px 64px;background:var(--bg);color:var(--fg);font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
h1{margin:0 0 10px;font-size:20px}h2{margin:28px 0 8px;font-size:12px;letter-spacing:.08em;color:var(--mute)}
nav{display:flex;flex-wrap:wrap;gap:6px}nav a{padding:3px 8px;border:1px solid var(--line);color:var(--fg);text-decoration:none}
nav a[aria-current]{background:var(--fg);color:var(--bg)}a{color:var(--fg)}.note{color:var(--mute);font-size:12px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:16px}
.card{border:1px solid var(--line);padding:10px}.card b{display:block;font-size:22px}.card span{color:var(--mute);font-size:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:0 16px}section{overflow-x:auto}
table{width:100%;border-collapse:collapse}th,td{padding:4px 6px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;overflow-wrap:anywhere}
th{color:var(--mute);font-weight:400}button{font:inherit;color:var(--fg);background:none;border:1px solid var(--line);padding:1px 8px;cursor:pointer}.track{display:block;min-width:80px}.bar{display:block;height:8px;background:var(--fg);opacity:.7}.empty{color:var(--mute)}`;

// Marks this browser as the owner's: atlas.js then sends nothing from it. Same origin as the pages, so same localStorage.
const SELF_MARK = `(function(){var k='atlas.self',s=document.getElementById('self-state'),b=document.getElementById('self-toggle');
function on(){try{return localStorage.getItem(k)==='1'}catch(e){return null}}
function show(){var v=on();s.textContent=v===null?'无法使用本地存储':v?'已标记，不计入统计':'未标记，计入统计';b.textContent=v?'取消标记':'标记';b.disabled=v===null}
b.onclick=function(){try{if(on())localStorage.removeItem(k);else localStorage.setItem(k,'1')}catch(e){}show()};show()})()`;

export function renderPage(d: Data, r: Range): string {
  const t = d.totals as Row;
  const pathQ = r.path ? `&path=${encodeURIComponent(r.path)}` : '';
  const maxDaily = Math.max(1, ...d.daily.map((x) => Number(x.pvs)));
  const hourMap = new Map(d.hours.map((h) => [Number(h.h), Number(h.n)]));
  const maxHour = Math.max(1, ...hourMap.values());
  const dimTables = Object.entries(DIMENSIONS).map(([col, name]) => {
    const rows = d.dims[col] ?? [];
    const max = Math.max(1, ...rows.map((x) => Number(x.n)));
    return table(name, [name, '浏览', '平均阅读', ''], rows.map((x) => [
      col === 'path' ? `<a href="?days=${r.days}&path=${encodeURIComponent(String(x.k))}">${esc(x.k)}</a>` : esc(x.k),
      esc(x.n), secs(x.avg_ms), bar(Number(x.n), max),
    ]));
  }).join('');
  const sectionRows = d.sections.map((s) => [
    esc(s.sec), `${d.pathPvs ? Math.round((Number(s.readers) / d.pathPvs) * 100) : 0}%`,
    secs(Number(s.ms) / Math.max(1, Number(s.readers))), secs(s.ms),
  ]);
  const tz = `UTC${r.off >= 0 ? '+' : ''}${r.off / 60}`;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Atlas · 统计</title><style>${CSS}</style></head><body>
<header><h1>Atlas 统计</h1><nav>${[1, 7, 30, 90, 365].map((n) => `<a href="?days=${n}${pathQ}"${n === r.days ? ' aria-current="page"' : ''}>${n === 1 ? '24 小时' : `${n} 天`}</a>`).join('')}
<a href="?days=${r.days}">全部页面</a><a href="/admin/export.ndjson?days=${r.days}">导出 NDJSON</a></nav>
<p class="note">${r.path ? `页面：${esc(r.path)} · ` : ''}时间按美东（${tz}）显示；访客按 UTC 日去重；已排除机器人。</p>
<p class="note">本浏览器：<span id="self-state">—</span> <button id="self-toggle" type="button">标记</button>（标记后，这个浏览器打开 Atlas 页面不上报统计）</p></header>
<section class="cards">${card('浏览', t.pvs)}${card('访客·天', t.visitor_days)}${card('可识别浏览器', t.ids)}${card('回访浏览器', d.returning)}${card('平均阅读', secs(t.avg_ms))}${card('读到 90%', t.deep)}</section>
${table('每日', ['日期', '浏览', '访客', '平均阅读', ''], d.daily.map((x) => [esc(x.d), esc(x.pvs), esc(x.visitors), secs(x.avg_ms), bar(Number(x.pvs), maxDaily)]))}
${table('小时分布（美东）', ['小时', '浏览', ''], Array.from({ length: 24 }, (_, h) => [String(h).padStart(2, '0'), String(hourMap.get(h) ?? 0), bar(hourMap.get(h) ?? 0, maxHour)]))}
${table(`章节：${d.topPath ?? '—'}`, ['章节', '到达率', '人均停留', '总停留'], sectionRows)}
<div class="grid">${dimTables}</div>
${table('点击排行', ['元素', '文字', '次数'], d.clicks.map((x) => [esc(x.el), esc(x.txt), esc(x.n)]))}
${table('外链点击', ['链接', '次数'], d.outbound.map((x) => [esc(x.href), esc(x.n)]))}
${table('复制的文字', ['内容', '次数'], d.copies.map((x) => [esc(x.txt), esc(x.n)]))}
${table('幻灯片查看', ['幻灯片', '次数'], d.slides.map((x) => [esc(x.slide), esc(x.n)]))}
${table('最近 50 次浏览', ['时间（美东）', '页面', '语言', '地点', '来源', '设备', '阅读', '深度', '点击'], d.recent.map((x) => [
    esc(new Date(Number(x.t0) + r.off * 60_000).toISOString().slice(5, 16).replace('T', ' ')), esc(x.path), esc(x.lang),
    esc([x.city, x.country].filter(Boolean).join(', ')), esc(x.ref), esc(`${x.device ?? ''} ${x.browser ?? ''}`), secs(x.ms),
    `${esc(x.depth ?? 0)}%`, esc(x.clicks),
  ]))}
<script>${SELF_MARK}</script>
</body></html>`;
}

const HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };

export async function renderDashboard(env: Env, url: URL): Promise<Response> {
  const r = parseRange(url);
  return new Response(renderPage(await collect(env, r), r), { headers: { ...HEADERS, 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function exportRows(env: Env, url: URL): Promise<Response> {
  const r = parseRange(url, Date.now(), EXPORT_RANGES);
  const after = Math.max(0, Number(url.searchParams.get('after') ?? '0') || 0);
  const rows = (await env.DB.prepare('SELECT * FROM beacons WHERE received_at >= ?1 AND id > ?2 ORDER BY id LIMIT 5000')
    .bind(r.since, after).all<Row>()).results;
  const body = rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');
  const next = rows.length === 5000 ? String(rows[rows.length - 1].id) : '';
  return new Response(body, { headers: { ...HEADERS, 'Content-Type': 'application/x-ndjson; charset=utf-8', 'X-Next-After': next } });
}
