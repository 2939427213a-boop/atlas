import type { Env } from './env';

let keys = new Map<string, CryptoKey>();
let keysUntil = 0;
let lastLoad = 0;

export function resetAccessCache(): void {
  keys = new Map();
  keysUntil = 0;
  lastLoad = 0;
}

function bytes(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function json(s: string): Record<string, unknown> {
  const v: unknown = JSON.parse(new TextDecoder().decode(bytes(s)));
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('not an object');
  return v as Record<string, unknown>;
}

async function loadKeys(issuer: string): Promise<void> {
  lastLoad = Date.now();
  const res = await fetch(`${issuer}/cdn-cgi/access/certs`, { redirect: 'manual' });
  if (!res.ok) throw new Error(`jwks ${res.status}`);
  const doc = (await res.json()) as { keys?: Array<JsonWebKey & { kid?: string }> };
  const next = new Map<string, CryptoKey>();
  for (const k of doc.keys ?? []) {
    if (k.kty !== 'RSA' || typeof k.kid !== 'string') continue;
    next.set(k.kid, await crypto.subtle.importKey('jwk', k, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']));
  }
  keys = next;
  keysUntil = Date.now() + 300_000;
}

/** null = valid Cloudflare Access token for this application; otherwise the status to return. */
export async function checkAccess(request: Request, env: Env): Promise<null | 401 | 503> {
  if (!env.ACCESS_ISSUER || !env.ACCESS_AUD) return 503;
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || token.length > 16_384) return 401;
  const parts = token.split('.');
  if (parts.length !== 3) return 401;
  let header: Record<string, unknown>;
  let claims: Record<string, unknown>;
  try {
    header = json(parts[0]);
    claims = json(parts[1]);
  } catch {
    return 401;
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') return 401;
  const kid = header.kid;
  const stale = Date.now() >= keysUntil;
  const unknownKid = !keys.has(kid) && Date.now() - lastLoad > 10_000; // key rotation, rate-limited
  if (stale || unknownKid) {
    try { await loadKeys(env.ACCESS_ISSUER); } catch { return 503; }
  }
  const key = keys.get(kid);
  if (!key) return 401;
  let ok = false;
  try {
    ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, bytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  } catch {
    return 401;
  }
  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!ok || claims.iss !== env.ACCESS_ISSUER || !aud.includes(env.ACCESS_AUD) || typeof claims.exp !== 'number' || claims.exp <= now) return 401;
  return null;
}
