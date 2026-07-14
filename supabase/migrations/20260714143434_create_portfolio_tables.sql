/*
# Create portfolio, alerts, and notifications tables (single-tenant, no auth)

This migration creates the core data tables for the BIST/Kripto portfolio analysis platform.

## 1. New Tables

### holdings
Stores the user's portfolio positions (crypto or stock assets).
- `id` (uuid, primary key)
- `symbol` (text, not null) — e.g. "BTC", "ETH", "THYAO"
- `name` (text) — human-readable asset name
- `asset_type` (text, not null) — "crypto" or "stock"
- `quantity` (numeric, not null) — amount held
- `average_buy_price` (numeric, not null) — average purchase price in the asset's currency
- `currency` (text, not null, default 'USD') — price currency
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### alerts
Stores price/indicator alerts the user wants to monitor.
- `id` (uuid, primary key)
- `symbol` (text, not null) — asset symbol to watch
- `asset_type` (text, not null) — "crypto" or "stock"
- `alert_type` (text, not null) — e.g. "price_above", "price_below", "rsi_overbought"
- `threshold_value` (numeric, not null) — the trigger threshold
- `interval` (text, default '1h') — check interval
- `is_active` (boolean, default true)
- `cooldown_minutes` (int, default 60)
- `last_triggered_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())

### notifications
Stores alert-triggered notifications shown to the user.
- `id` (uuid, primary key)
- `alert_id` (uuid, references alerts, cascade delete)
- `title` (text, not null)
- `message` (text, not null)
- `severity` (text, default 'info') — "info", "warning", "error"
- `is_read` (boolean, default false)
- `created_at` (timestamptz, default now())

## 2. Security
- RLS enabled on all three tables.
- Single-tenant app with no sign-in screen: policies allow `anon, authenticated` CRUD (data is intentionally shared/public).
*/

CREATE TABLE IF NOT EXISTS holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  name text,
  asset_type text NOT NULL DEFAULT 'crypto',
  quantity numeric NOT NULL DEFAULT 0,
  average_buy_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_holdings" ON holdings;
CREATE POLICY "anon_select_holdings" ON holdings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_holdings" ON holdings;
CREATE POLICY "anon_insert_holdings" ON holdings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_holdings" ON holdings;
CREATE POLICY "anon_update_holdings" ON holdings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_holdings" ON holdings;
CREATE POLICY "anon_delete_holdings" ON holdings FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  asset_type text NOT NULL DEFAULT 'crypto',
  alert_type text NOT NULL DEFAULT 'price_above',
  threshold_value numeric NOT NULL DEFAULT 0,
  interval text NOT NULL DEFAULT '1h',
  is_active boolean NOT NULL DEFAULT true,
  cooldown_minutes int NOT NULL DEFAULT 60,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_alerts" ON alerts;
CREATE POLICY "anon_select_alerts" ON alerts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_alerts" ON alerts;
CREATE POLICY "anon_insert_alerts" ON alerts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_alerts" ON alerts;
CREATE POLICY "anon_update_alerts" ON alerts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_alerts" ON alerts;
CREATE POLICY "anon_delete_alerts" ON alerts FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES alerts(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
