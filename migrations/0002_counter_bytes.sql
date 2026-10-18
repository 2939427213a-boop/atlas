-- Daily byte budget for stored beacons (protects the D1 storage shared with other projects).
ALTER TABLE counters ADD COLUMN bytes INTEGER NOT NULL DEFAULT 0;
