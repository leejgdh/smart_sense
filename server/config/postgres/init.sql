-- SmartSense Database Initialization Script

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create sensor_readings hypertable
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "timestamp" TIMESTAMPTZ NOT NULL,
    "nodeId" VARCHAR NOT NULL,
    "sensorType" VARCHAR NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR,
    location VARCHAR,
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('sensor_readings', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sensor_readings_node_sensor_time
    ON sensor_readings ("nodeId", "sensorType", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_time
    ON sensor_readings ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_location
    ON sensor_readings (location, "timestamp" DESC);

-- Compression policy (compress data older than 7 days)
SELECT add_compression_policy('sensor_readings', INTERVAL '7 days', if_not_exists => TRUE);

-- Retention policy (keep data for 1 year)
SELECT add_retention_policy('sensor_readings', INTERVAL '1 year', if_not_exists => TRUE);

-- Create continuous aggregate for hourly statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS sensor_readings_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', "timestamp") AS hour,
    "nodeId",
    "sensorType",
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    STDDEV(value) as stddev_value,
    COUNT(*) as count
FROM sensor_readings
GROUP BY hour, "nodeId", "sensorType"
WITH NO DATA;

-- Refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('sensor_readings_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Create continuous aggregate for daily statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS sensor_readings_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', "timestamp") AS day,
    "nodeId",
    "sensorType",
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    STDDEV(value) as stddev_value,
    COUNT(*) as count
FROM sensor_readings
GROUP BY day, "nodeId", "sensorType"
WITH NO DATA;

-- Refresh policy for daily aggregate
SELECT add_continuous_aggregate_policy('sensor_readings_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create sensor_nodes table
CREATE TABLE IF NOT EXISTS sensor_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nodeId" VARCHAR UNIQUE NOT NULL,
    location VARCHAR,
    description VARCHAR,
    "isActive" BOOLEAN DEFAULT TRUE,
    "lastSeenAt" TIMESTAMPTZ,
    metadata JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "timestamp" TIMESTAMPTZ DEFAULT NOW(),
    "insightType" VARCHAR NOT NULL,
    content TEXT NOT NULL,
    confidence REAL,
    "nodeId" VARCHAR,
    "sensorType" VARCHAR,
    "actionTaken" TEXT,
    "isRead" BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_timestamp ON ai_insights ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights ("insightType");
CREATE INDEX IF NOT EXISTS idx_ai_insights_node ON ai_insights ("nodeId");

-- Create device_control_logs table
CREATE TABLE IF NOT EXISTS device_control_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "timestamp" TIMESTAMPTZ DEFAULT NOW(),
    "deviceId" VARCHAR NOT NULL,
    "deviceType" VARCHAR,
    action VARCHAR NOT NULL,
    parameters JSONB,
    "triggeredBy" VARCHAR,
    success BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_device_logs_timestamp ON device_control_logs ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_device_logs_device ON device_control_logs ("deviceId");

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smartsense;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smartsense;

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sensor_nodes
CREATE TRIGGER update_sensor_nodes_updated_at
    BEFORE UPDATE ON sensor_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Done
SELECT 'SmartSense database initialized successfully!' AS status;
