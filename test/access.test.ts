import { env } from 'cloudflare:workers';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkAccess, resetAccessCache } from '../src/worker/access';

const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const part = (x: unknown) => b64url(enc.encode(JSON.stringify(x)));
let pair: CryptoKeyPair;
let other: CryptoKeyPair;
let jwk: JsonWebKey;

async function token(claims: Record<string, unknown> = {}, key?: CryptoKey) {
  const now = Math.floor(Date.now() / 1000);
  const data = `${part({ alg: 'RS256', kid: 'k1', typ: 'JWT' })}.${part({
    iss: env.ACCESS_ISSUER, aud: [env.ACCESS_AUD], exp: now + 300, iat: now - 1, type: 'app', email: 'owner@example.test', ...claims,
  })}`;
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key ?? pair.privateKey, enc.encode(data)));
  return `${data}.${b64url(sig)}`;
}
const req = (t?: string) => new Request('https://atlas.example.test/admin', { headers: t ? { 'Cf-Access-Jwt-Assertion': t } : {} });

beforeAll(async () => {
  const gen = () => crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'],
  ) as Promise<CryptoKeyPair>;
  pair = await gen();
  other = await gen();
  jwk = { ...((await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey), kid: 'k1' } as JsonWebKey;
});
beforeEach(() => {
  resetAccessCache();
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    if (String(input) !== `${env.ACCESS_ISSUER}/cdn-cgi/access/certs`) throw new Error(`unexpected fetch ${String(input)}`);
    return Response.json({ keys: [jwk] });
  });
});
afterEach(() => vi.restoreAllMocks());

describe('checkAccess', () => {
  it('accepts a valid token', async () => {
    expect(await checkAccess(req(await token()), env)).toBeNull();
  });
  it('rejects a missing token', async () => {
    expect(await checkAccess(req(), env)).toBe(401);
  });
  it('rejects another audience', async () => {
    expect(await checkAccess(req(await token({ aud: ['someone-else'] })), env)).toBe(401);
  });
  it('rejects an expired token', async () => {
    expect(await checkAccess(req(await token({ exp: Math.floor(Date.now() / 1000) - 5 })), env)).toBe(401);
  });
  it('rejects a token signed by another key', async () => {
    expect(await checkAccess(req(await token({}, other.privateKey)), env)).toBe(401);
  });
  it('fails closed when ACCESS_AUD is empty', async () => {
    expect(await checkAccess(req(await token()), { ...env, ACCESS_AUD: '' })).toBe(503);
  });
});
