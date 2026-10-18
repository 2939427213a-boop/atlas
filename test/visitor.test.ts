import { describe, expect, it } from 'vitest';
import { parseUa, persistAllowed, utcDay, visitorHash } from '../src/worker/visitor';

const h = (x: Record<string, string> = {}) => new Headers(x);

describe('persistAllowed', () => {
  it('allows ordinary visitors outside Europe', () => {
    expect(persistAllowed('US', h())).toBe(true);
    expect(persistAllowed('CN', h())).toBe(true);
  });
  it('refuses EU, EEA, UK and Swiss visitors', () => {
    for (const c of ['DE', 'FR', 'IE', 'NO', 'IS', 'LI', 'GB', 'CH']) expect(persistAllowed(c, h())).toBe(false);
  });
  it('refuses unknown countries and Tor', () => {
    expect(persistAllowed(undefined, h())).toBe(false);
    expect(persistAllowed('XX', h())).toBe(false);
    expect(persistAllowed('T1', h())).toBe(false);
  });
  it('honours GPC and DNT', () => {
    expect(persistAllowed('US', h({ 'Sec-GPC': '1' }))).toBe(false);
    expect(persistAllowed('US', h({ DNT: '1' }))).toBe(false);
  });
});

describe('visitorHash', () => {
  it('is 16 hex chars and depends on the salt', async () => {
    const a = await visitorHash('s1', '203.0.113.7', 'ua');
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(await visitorHash('s1', '203.0.113.7', 'ua')).toBe(a);
    expect(await visitorHash('s2', '203.0.113.7', 'ua')).not.toBe(a);
  });
});

describe('parseUa', () => {
  it('recognises common browsers, systems and bots', () => {
    expect(parseUa('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'))
      .toEqual({ browser: 'Safari', os: 'iOS', device: 'mobile', bot: false });
    expect(parseUa('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0'))
      .toEqual({ browser: 'Edge', os: 'Windows', device: 'desktop', bot: false });
    expect(parseUa('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.50'))
      .toEqual({ browser: 'WeChat', os: 'Android', device: 'mobile', bot: false });
    expect(parseUa('Twitterbot/1.0').bot).toBe(true);
    expect(parseUa('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36').bot).toBe(true);
  });
  it('formats UTC days', () => {
    expect(utcDay(Date.UTC(2026, 9, 10, 23, 59))).toBe('2026-10-10');
  });
});
