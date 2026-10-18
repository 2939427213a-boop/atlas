-- One row per beacon (one flush of events from one page load).
CREATE TABLE beacons (
  id          INTEGER PRIMARY KEY,
  received_at INTEGER NOT NULL,   -- server time, ms since epoch (UTC)
  day         TEXT    NOT NULL,   -- UTC day YYYY-MM-DD
  schema      INTEGER NOT NULL,
  pv          TEXT    NOT NULL,   -- random id per page load
  seq         INTEGER NOT NULL,   -- flush number within the page load
  final       INTEGER NOT NULL,   -- 1 = sent when the page was hidden or closed
  vid         TEXT,               -- random browser id; NULL for EEA/UK/CH, GPC, DNT
  dvid        TEXT    NOT NULL,   -- sha256(daily salt | ip | ua), 16 hex
  path        TEXT    NOT NULL,   -- clean URL path
  lang        TEXT,
  page        TEXT,
  page_ver    TEXT,
  active_ms   INTEGER NOT NULL,   -- reading time in this flush (visible tab, not idle)
  max_depth   INTEGER,            -- deepest scroll so far, 0-100
  n_events    INTEGER NOT NULL,
  n_clicks    INTEGER NOT NULL,
  ref_host    TEXT,
  country     TEXT, region TEXT, city TEXT, tz TEXT, lat REAL, lon REAL,
  asn         INTEGER, as_org TEXT, colo TEXT, http TEXT, rtt INTEGER,
  ua          TEXT, accept_lang TEXT, browser TEXT, os TEXT, device TEXT,
  bot         INTEGER NOT NULL,
  meta        TEXT,               -- JSON page context, first flush only
  events      TEXT    NOT NULL    -- JSON array of raw events
);
CREATE INDEX beacons_received ON beacons (received_at);
CREATE TABLE salts (day TEXT PRIMARY KEY, salt TEXT NOT NULL);
CREATE TABLE counters (day TEXT PRIMARY KEY, n INTEGER NOT NULL);
