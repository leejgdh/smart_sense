import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { PrismaService } from '../database/prisma.service';

interface SensorData {
  node_id: string;
  timestamp: number;
  sensors: {
    [key: string]: {
      value: number | string;
      unit: string;
      timestamp: number;
    };
  };
}

interface StatusMessage {
  node_id: string;
  status: 'online' | 'offline';
  location?: string;
  description?: string;
  timestamp: number;
}

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;
  private readonly brokerUrl: string;
  private readonly clientId: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.brokerUrl = this.configService.get('MQTT_BROKER_URL', 'mqtt://localhost:1883');
    this.clientId = this.configService.get('MQTT_CLIENT_ID', 'smartsense-backend');
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.logger.log(`Connecting to MQTT broker: ${this.brokerUrl}`);

      this.client = mqtt.connect(this.brokerUrl, {
        clientId: this.clientId,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
      });

      this.client.on('connect', () => {
        this.logger.log('Connected to MQTT broker');
        this.subscribe();
      });

      this.client.on('error', (error) => {
        this.logger.error(`MQTT connection error: ${error.message}`);
      });

      this.client.on('reconnect', () => {
        this.logger.warn('Reconnecting to MQTT broker...');
      });

      this.client.on('message', (topic, payload) => {
        this.handleMessage(topic, payload);
      });
    } catch (error) {
      this.logger.error(`Failed to connect to MQTT broker: ${error.message}`);
    }
  }

  private subscribe(): void {
    // Subscribe to SmartSense topics
    const topics = [
      'smartsense/+/status',   // Node status (online/offline)
      'smartsense/+/sensors',  // Sensor data
    ];

    topics.forEach((topic) => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${topic}: ${err.message}`);
        } else {
          this.logger.log(`Subscribed to ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, payload: Buffer): Promise<void> {
    try {
      const parts = topic.split('/');

      if (parts.length !== 3 || parts[0] !== 'smartsense') {
        this.logger.warn(`Invalid topic format: ${topic}`);
        return;
      }

      const nodeId = parts[1];
      const messageType = parts[2];

      const message = JSON.parse(payload.toString());

      switch (messageType) {
        case 'status':
          await this.handleStatusMessage(nodeId, message as StatusMessage);
          break;
        case 'sensors':
          await this.handleSensorData(nodeId, message as SensorData);
          break;
        default:
          this.logger.warn(`Unknown message type: ${messageType}`);
      }
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
      this.logger.debug(`Topic: ${topic}, Payload: ${payload.toString()}`);
    }
  }

  private async handleStatusMessage(nodeId: string, message: StatusMessage): Promise<void> {
    try {
      this.logger.log(`Node ${nodeId} status: ${message.status}`);

      // Find or create sensor node
      await this.prisma.sensorNode.upsert({
        where: { nodeId },
        update: {
          isActive: message.status === 'online',
          lastSeenAt: new Date(message.timestamp),
          ...(message.location && { location: message.location }),
          ...(message.description && { description: message.description }),
        },
        create: {
          nodeId,
          name: nodeId,
          location: message.location || 'Unknown',
          description: message.description || '',
          isActive: message.status === 'online',
          lastSeenAt: new Date(message.timestamp),
        },
      });

      this.logger.debug(`Updated node ${nodeId} in database`);
    } catch (error) {
      this.logger.error(`Error handling status message: ${error.message}`);
    }
  }

  private async handleSensorData(nodeId: string, data: SensorData): Promise<void> {
    try {
      this.logger.debug(`Received sensor data from ${nodeId}`);

      // Ensure node exists and update last seen
      const node = await this.prisma.sensorNode.upsert({
        where: { nodeId },
        update: {
          lastSeenAt: new Date(data.timestamp),
        },
        create: {
          nodeId,
          name: nodeId,
          location: 'Unknown',
          isActive: true,
          lastSeenAt: new Date(data.timestamp),
        },
      });

      // Save sensor readings (filter out non-numeric values)
      const readings = Object.entries(data.sensors)
        .map(([sensorName, sensorValue]) => {
          const value = typeof sensorValue.value === 'number'
            ? sensorValue.value
            : parseFloat(String(sensorValue.value));

          // Skip if value is NaN (e.g., text values like "good", "excellent")
          if (isNaN(value)) {
            this.logger.debug(`Skipping non-numeric value for ${sensorName}: ${sensorValue.value}`);
            return null;
          }

          return {
            nodeId: node.id,
            sensorType: this.extractSensorType(sensorName),
            metricName: sensorName,
            value,
            unit: sensorValue.unit,
            timestamp: new Date(sensorValue.timestamp),
          };
        })
        .filter((reading) => reading !== null);

      if (readings.length > 0) {
        await this.prisma.sensorReading.createMany({
          data: readings,
        });
        this.logger.log(`Saved ${readings.length} sensor readings from ${nodeId}`);
      }
    } catch (error) {
      this.logger.error(`Error handling sensor data: ${error.message}`);
      this.logger.debug(JSON.stringify(data, null, 2));
    }
  }

  private extractSensorType(metricName: string): string {
    // Extract sensor type from metric name like "BME680/temperature"
    if (metricName.includes('/')) {
      return metricName.split('/')[0];
    }
    // Or from metric name like "temperature", "humidity"
    const typeMap: Record<string, string> = {
      temperature: 'BME680',
      humidity: 'BME680',
      pressure: 'BME680',
      gas_resistance: 'BME680',
      air_quality_score: 'BME680',
      co2: 'SCD40',
      co2_level: 'SCD40',
      pm1_0: 'PMS5003',
      pm2_5: 'PMS5003',
      pm10: 'PMS5003',
      pm2_5_aqi: 'PMS5003',
      illuminance: 'BH1750',
      light_level: 'BH1750',
    };

    return typeMap[metricName] || 'UNKNOWN';
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.logger.log('Disconnecting from MQTT broker');
      await this.client.endAsync();
    }
  }

  // Publish command to sensor node
  async publishCommand(nodeId: string, command: any): Promise<void> {
    const topic = `smartsense/${nodeId}/command`;
    const payload = JSON.stringify(command);

    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          this.logger.error(`Failed to publish command to ${nodeId}: ${err.message}`);
          reject(err);
        } else {
          this.logger.log(`Published command to ${nodeId}`);
          resolve();
        }
      });
    });
  }
}
