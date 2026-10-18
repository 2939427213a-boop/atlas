// Privacy-relevant helpers. Keep public/privacy.html in sync with what these do.

const NO_PERSIST = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', // EU
  'IS', 'LI', 'NO', // rest of the EEA
  'GB', 'CH',
]);

/** Whether this visitor may keep a random id in localStorage. */
export function persistAllowed(country: string | undefined, headers: Headers): boolean {
  if (!country || country === 'XX' || country === 'T1') return false; // unknown or Tor
  if (NO_PERSIST.has(country)) return false;
  return headers.get('Sec-GPC') !== '1' && headers.get('DNT') !== '1';
}

export function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

let saltCache: { day: string; salt: string } | null = null;

export function resetSaltCache(): void {
  saltCache = null;
}

/** One random salt per UTC day, shared by all isolates through D1 and deleted by the daily prune. */
export async function dailySalt(db: D1Database, day: string): Promise<string> {
  if (saltCache?.day === day) return saltCache.salt;
  await db.prepare('INSERT OR IGNORE INTO salts (day, salt) VALUES (?1, ?2)')
    .bind(day, crypto.randomUUID() + crypto.randomUUID()).run();
  const row = await db.prepare('SELECT salt FROM salts WHERE day = ?1').bind(day).first<{ salt: string }>();
  if (!row) throw new Error('daily salt missing');
  saltCache = { day, salt: row.salt };
  return row.salt;
}

export async function visitorHash(salt: string, ip: string, ua: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}|${ip}|${ua}`)));
  return Array.from(digest.slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|embedly|preview|curl\/|wget\/|python-|go-http|node-fetch|axios/i;

export function parseUa(ua: string): { browser: string; os: string; device: string; bot: boolean } {
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /CrOS/.test(ua) ? 'ChromeOS'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'other';
  const browser = /MicroMessenger/.test(ua) ? 'WeChat' : /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera'
    : /SamsungBrowser/.test(ua) ? 'Samsung' : /Firefox\/|FxiOS/.test(ua) ? 'Firefox' : /Chrome\/|CriOS/.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari' : 'other';
  const device = /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tablet'
    : /Mobi|iPhone|iPod|Android/.test(ua) ? 'mobile' : 'desktop';
  return { browser, os, device, bot: BOT.test(ua) };
}
