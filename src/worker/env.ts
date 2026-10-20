export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ACCESS_ISSUER: string;   // https://<team>.cloudflareaccess.com
  ACCESS_AUD: string;      // Access application AUD tag; empty = /admin fails closed
  OWNER_EMAIL?: string;    // secret: the only email /admin admits; unset = /admin fails closed
  DAILY_BEACON_CAP: string;
  DAILY_BYTE_CAP: string;  // bytes of beacon bodies stored per UTC day
  RETENTION_DAYS: string;
  DEV_ADMIN_OPEN?: string; // "1" only in .dev.vars; honoured only on localhost
}
