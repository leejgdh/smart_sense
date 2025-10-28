-- CreateTable
CREATE TABLE "sensor_nodes" (
    "id" SERIAL NOT NULL,
    "node_id" TEXT NOT NULL,
    "name" TEXT,
    "location" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensor_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "node_id" INTEGER NOT NULL,
    "sensor_type" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("timestamp","node_id","metric_name")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" SERIAL NOT NULL,
    "node_id" INTEGER NOT NULL,
    "insight_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_control_logs" (
    "id" SERIAL NOT NULL,
    "node_id" INTEGER,
    "device_id" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "parameters" JSONB,
    "triggered_by" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_control_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sensor_nodes_node_id_key" ON "sensor_nodes"("node_id");

-- CreateIndex
CREATE INDEX "sensor_readings_node_id_idx" ON "sensor_readings"("node_id");

-- CreateIndex
CREATE INDEX "sensor_readings_timestamp_idx" ON "sensor_readings"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "sensor_readings_sensor_type_idx" ON "sensor_readings"("sensor_type");

-- CreateIndex
CREATE INDEX "ai_insights_node_id_idx" ON "ai_insights"("node_id");

-- CreateIndex
CREATE INDEX "ai_insights_created_at_idx" ON "ai_insights"("created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_insights_severity_idx" ON "ai_insights"("severity");

-- CreateIndex
CREATE INDEX "device_control_logs_node_id_idx" ON "device_control_logs"("node_id");

-- CreateIndex
CREATE INDEX "device_control_logs_device_id_idx" ON "device_control_logs"("device_id");

-- CreateIndex
CREATE INDEX "device_control_logs_created_at_idx" ON "device_control_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "sensor_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "sensor_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_control_logs" ADD CONSTRAINT "device_control_logs_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "sensor_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
