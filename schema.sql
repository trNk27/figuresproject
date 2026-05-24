-- Run this once in the Neon SQL editor (console.neon.tech)

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(30)  UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100),
  location      VARCHAR(100),
  bio           TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE harvests (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species        VARCHAR(100) NOT NULL,
  date           DATE,
  distance_yards INTEGER,
  cartridge      VARCHAR(100),
  wind_mph       INTEGER,
  location       VARCHAR(200),
  notes          TEXT,
  is_public      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_harvests_user    ON harvests(user_id);
CREATE INDEX idx_harvests_created ON harvests(created_at DESC);
CREATE INDEX idx_harvests_public  ON harvests(is_public, created_at DESC) WHERE is_public = true;
