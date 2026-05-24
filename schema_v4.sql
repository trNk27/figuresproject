-- Migration v4 — run in Neon SQL editor after schema_v3.sql
-- Adds support for interactive shot marking and escape distances (Fluchtstrecke)

ALTER TABLE harvests ADD COLUMN IF NOT EXISTS hit_x REAL;
ALTER TABLE harvests ADD COLUMN IF NOT EXISTS hit_y REAL;
ALTER TABLE harvests ADD COLUMN IF NOT EXISTS escape_distance_meters INTEGER;
