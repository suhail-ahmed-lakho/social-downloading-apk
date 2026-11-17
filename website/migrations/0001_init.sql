-- Cloudflare D1 Schema for OmniSaver Web & Mobile Platform
-- Migration: 0001_init.sql

CREATE TABLE IF NOT EXISTS omnisaver_licenses (
  id TEXT PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  device_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount_pkr INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  tid_notes TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_licenses_key ON omnisaver_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_device ON omnisaver_licenses(device_id);

CREATE TABLE IF NOT EXISTS omnisaver_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  latest_version TEXT NOT NULL,
  apk_download_url TEXT NOT NULL,
  force_update INTEGER NOT NULL DEFAULT 0,
  release_notes TEXT NOT NULL,
  ads_enabled INTEGER NOT NULL DEFAULT 1,
  banner_enabled INTEGER NOT NULL DEFAULT 1,
  interstitial_enabled INTEGER NOT NULL DEFAULT 1,
  rewarded_enabled INTEGER NOT NULL DEFAULT 1,
  interstitial_frequency INTEGER NOT NULL DEFAULT 2,
  payment_accounts TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS omnisaver_telemetry (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  platform TEXT,
  device_id TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_source ON omnisaver_telemetry(source);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON omnisaver_telemetry(created_at);

-- Seed default configuration row (id = 1)
INSERT OR IGNORE INTO omnisaver_config (
  id,
  latest_version,
  apk_download_url,
  force_update,
  release_notes,
  ads_enabled,
  banner_enabled,
  interstitial_enabled,
  rewarded_enabled,
  interstitial_frequency,
  payment_accounts,
  whatsapp_number,
  updated_at
) VALUES (
  1,
  '1.0.16',
  'https://looknow.cyou/api/download/apk',
  0,
  '["OmniSaver v1.0.16 Official Release","Instagram DOM media interceptor","Pinterest 1080p MP4 & master photos","Cloudflare D1 Native Edge Database"]',
  1,
  1,
  1,
  1,
  2,
  '{"easypaisa":{"title":"Suhail Ahmed","accountNo":"03001234567"},"nayapay":{"title":"Suhail Ahmed","accountId":"03001234567@nayapay"},"bankIban":{"bank":"Meezan Bank Limited","title":"Suhail Ahmed","iban":"PK36MEZN0001234567890123"}}',
  '+923001234567',
  1731844800000
);

-- Seed starter VIP license for verification
INSERT OR IGNORE INTO omnisaver_licenses (
  id,
  license_key,
  device_id,
  plan_type,
  amount_pkr,
  status,
  tid_notes,
  created_at,
  expires_at
) VALUES (
  'lic_init_seed',
  'OMNI-PRO-DEMO-2026',
  'OMNI-DEMO-DEVICE',
  'yearly',
  4500,
  'active',
  'Default VIP Starter Key',
  1731844800000,
  1763380800000
);
