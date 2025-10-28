-- TimescaleDB Extension Setup
-- This file should be run once after the initial migration to enable TimescaleDB features

-- 1. Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 2. Convert sensor_readings table to a TimescaleDB hypertable
-- This enables time-series specific optimizations and functions like time_bucket()
SELECT create_hypertable(
  'sensor_readings',
  'timestamp',
  migrate_data => TRUE,
  if_not_exists => TRUE
);

-- 3. (Optional) Set compression policy for old data
-- Compress data older than 7 days to save storage space
-- ALTER TABLE sensor_readings SET (
--   timescaledb.compress,
--   timescaledb.compress_segmentby = 'node_id,sensor_type'
-- );

-- SELECT add_compression_policy('sensor_readings', INTERVAL '7 days');

-- 4. (Optional) Set retention policy
-- Automatically drop data older than 90 days
-- SELECT add_retention_policy('sensor_readings', INTERVAL '90 days');
