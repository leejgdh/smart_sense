import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SensorQueryDto, AggregateQueryDto } from './dto/sensor-query.dto';

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);

  constructor(private prisma: PrismaService) {}

  // Get all sensor nodes
  async getNodes() {
    return this.prisma.sensorNode.findMany({
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  // Get specific node
  async getNode(nodeId: string) {
    const node = await this.prisma.sensorNode.findUnique({
      where: { nodeId },
    });

    if (!node) {
      throw new NotFoundException(`Sensor node ${nodeId} not found`);
    }

    return node;
  }

  // Get current sensor values for a node
  async getCurrentValues(nodeId: string) {
    const node = await this.getNode(nodeId);

    const readings = await this.prisma.$queryRaw<
      Array<{
        sensor_type: string;
        metric_name: string;
        value: number;
        unit: string;
        timestamp: Date;
      }>
    >`
      SELECT DISTINCT ON (sensor_type, metric_name)
        sensor_type, metric_name, value, unit, timestamp
      FROM sensor_readings
      WHERE node_id = ${node.id}
      ORDER BY sensor_type, metric_name, timestamp DESC
    `;

    return {
      node,
      readings: readings.map((r) => ({
        sensorType: r.sensor_type,
        metricName: r.metric_name,
        value: r.value,
        unit: r.unit,
        timestamp: r.timestamp,
      })),
    };
  }

  // Get sensor readings with filters
  async getReadings(query: SensorQueryDto) {
    const where: any = {};

    if (query.nodeId) {
      const node = await this.getNode(query.nodeId);
      where.nodeId = node.id;
    }

    if (query.sensorType) {
      where.sensorType = query.sensorType;
    }

    if (query.startTime && query.endTime) {
      where.timestamp = {
        gte: query.startTime,
        lte: query.endTime,
      };
    } else if (query.startTime) {
      where.timestamp = { gte: query.startTime };
    } else if (query.endTime) {
      where.timestamp = { lte: query.endTime };
    }

    const [readings, total] = await Promise.all([
      this.prisma.sensorReading.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: query.offset || 0,
        take: query.limit || 100,
      }),
      this.prisma.sensorReading.count({ where }),
    ]);

    return {
      data: readings,
      total,
      limit: query.limit || 100,
      offset: query.offset || 0,
    };
  }

  // Get aggregated statistics
  async getAggregatedData(query: AggregateQueryDto) {
    const interval = this.parseInterval(query.interval);
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (query.nodeId) {
      const node = await this.getNode(query.nodeId);
      whereClauses.push(`node_id = $${params.length + 1}`);
      params.push(node.id);
    }

    if (query.sensorType) {
      whereClauses.push(`sensor_type = $${params.length + 1}`);
      params.push(query.sensorType);
    }

    if (query.startTime && query.endTime) {
      whereClauses.push(`timestamp BETWEEN $${params.length + 1} AND $${params.length + 2}`);
      params.push(query.startTime, query.endTime);
    }

    const whereClause = whereClauses.length > 0 ? whereClauses.join(' AND ') : '1=1';

    const sql = `
      SELECT
        time_bucket('${interval}'::interval, timestamp) as bucket,
        node_id,
        sensor_type,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        STDDEV(value) as stddev_value,
        COUNT(*) as count
      FROM sensor_readings
      WHERE ${whereClause}
      GROUP BY bucket, node_id, sensor_type
      ORDER BY bucket DESC
    `;

    return this.prisma.$queryRawUnsafe(sql, ...params);
  }

  // Get sensor types for a node
  async getSensorTypes(nodeId: string) {
    const node = await this.getNode(nodeId);

    const result = await this.prisma.$queryRaw<
      Array<{ sensor_type: string; metric_name: string; unit: string }>
    >`
      SELECT DISTINCT sensor_type, metric_name, unit
      FROM sensor_readings
      WHERE node_id = ${node.id}
      ORDER BY sensor_type, metric_name
    `;

    return result.map((r) => ({
      sensorType: r.sensor_type,
      metricName: r.metric_name,
      unit: r.unit,
    }));
  }

  // Get statistics for a sensor
  async getSensorStatistics(nodeId: string, sensorType: string, hours: number = 24) {
    const node = await this.getNode(nodeId);
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const readings = await this.prisma.sensorReading.findMany({
      where: {
        nodeId: node.id,
        sensorType,
        timestamp: {
          gte: startTime,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (readings.length === 0) {
      return null;
    }

    const values = readings.map((r) => r.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const squaredDiffs = values.map((v) => Math.pow(v - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stddev = Math.sqrt(avgSquaredDiff);

    return {
      nodeId,
      sensorType,
      period: `${hours} hours`,
      count: readings.length,
      avg: parseFloat(avg.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      stddev: parseFloat(stddev.toFixed(2)),
      latest: readings[readings.length - 1],
    };
  }

  // Get chart data for a node with flexible filtering
  async getChartData(
    nodeId: string,
    sensorType?: string,
    metricName?: string,
    startTime?: string,
    endTime?: string,
    hours: number = 24,
    points: number = 100,
    realtime: boolean = false,
  ) {
    const node = await this.getNode(nodeId);

    // Calculate time range
    let calculatedStartTime: Date;
    let calculatedEndTime: Date;

    if (startTime && endTime) {
      calculatedStartTime = new Date(startTime);
      calculatedEndTime = new Date(endTime);
    } else if (startTime) {
      calculatedStartTime = new Date(startTime);
      calculatedEndTime = new Date(calculatedStartTime.getTime() + hours * 60 * 60 * 1000);
    } else if (endTime) {
      calculatedEndTime = new Date(endTime);
      calculatedStartTime = new Date(calculatedEndTime.getTime() - hours * 60 * 60 * 1000);
    } else {
      calculatedEndTime = new Date();
      calculatedStartTime = new Date(calculatedEndTime.getTime() - hours * 60 * 60 * 1000);
    }

    // Calculate interval based on time range and desired points
    const timeRangeMs = calculatedEndTime.getTime() - calculatedStartTime.getTime();
    const intervalMinutes = Math.ceil(timeRangeMs / (points * 60 * 1000));
    const interval = `${intervalMinutes} minutes`;

    // Build WHERE clause
    const params: any[] = [node.id, calculatedStartTime, calculatedEndTime];
    const whereClauses = ['node_id = $1', 'timestamp >= $2', 'timestamp <= $3'];

    if (sensorType) {
      whereClauses.push(`sensor_type = $${params.length + 1}`);
      params.push(sensorType);
    }
    if (metricName) {
      whereClauses.push(`metric_name = $${params.length + 1}`);
      params.push(metricName);
    }

    const whereClause = whereClauses.join(' AND ');

    // Get all sensor types based on filters
    const sensorTypesSQL = `
      SELECT DISTINCT sensor_type, metric_name, unit
      FROM sensor_readings
      WHERE ${whereClause}
      ORDER BY sensor_type, metric_name
    `;

    const sensorTypes = await this.prisma.$queryRawUnsafe<
      Array<{ sensor_type: string; metric_name: string; unit: string }>
    >(sensorTypesSQL, ...params);

    // Get time-series data for each sensor type
    const sensors = await Promise.all(
      sensorTypes.map(async (sensor) => {
        let dataSQL: string;
        let data: Array<{ timestamp?: Date; bucket?: Date; value?: number; avg_value?: number }>;

        if (realtime) {
          // Real-time mode: Return raw data without aggregation
          dataSQL = `
            SELECT
              timestamp,
              value
            FROM sensor_readings
            WHERE node_id = $1
              AND metric_name = $2
              AND timestamp >= $3
              AND timestamp <= $4
            ORDER BY timestamp ASC
          `;

          data = await this.prisma.$queryRawUnsafe<
            Array<{ timestamp: Date; value: number }>
          >(dataSQL, node.id, sensor.metric_name, calculatedStartTime, calculatedEndTime);
        } else {
          // Aggregated mode: Use time_bucket
          dataSQL = `
            SELECT
              time_bucket('${interval}'::interval, timestamp) as bucket,
              AVG(value) as avg_value
            FROM sensor_readings
            WHERE node_id = $1
              AND metric_name = $2
              AND timestamp >= $3
              AND timestamp <= $4
            GROUP BY bucket
            ORDER BY bucket ASC
          `;

          data = await this.prisma.$queryRawUnsafe<
            Array<{ bucket: Date; avg_value: number }>
          >(dataSQL, node.id, sensor.metric_name, calculatedStartTime, calculatedEndTime);
        }

        return {
          metricName: sensor.metric_name,
          sensorType: sensor.sensor_type,
          unit: sensor.unit,
          data: data.map((d) => ({
            timestamp: realtime ? d.timestamp! : d.bucket!,
            value: parseFloat(Number(realtime ? d.value : d.avg_value).toFixed(2)),
          })),
        };
      }),
    );

    return {
      nodeId: node.nodeId,
      nodeName: node.name || node.nodeId,
      startTime: calculatedStartTime,
      endTime: calculatedEndTime,
      interval,
      sensors,
    };
  }

  private parseInterval(interval: string): string {
    const mapping = {
      '1 minute': '1 minute',
      '5 minutes': '5 minutes',
      '15 minutes': '15 minutes',
      '1 hour': '1 hour',
      '6 hours': '6 hours',
      '1 day': '1 day',
      '1 week': '1 week',
    };

    return mapping[interval] || '1 hour';
  }
}
