import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MqttService } from '../mqtt/mqtt.service';
import { DeviceControlDto } from './dto/device-control.dto';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  // In-memory device registry (in production, this would be in database)
  private devices: Map<
    string,
    {
      id: string;
      type: string;
      name: string;
      status: string;
      lastSeen: Date;
    }
  > = new Map();

  constructor(
    private prisma: PrismaService,
    private mqttService: MqttService,
  ) {
    // Initialize with mock devices
    this.initializeMockDevices();
  }

  private initializeMockDevices() {
    // Add some example devices
    this.devices.set('humidifier-01', {
      id: 'humidifier-01',
      type: 'humidifier',
      name: 'Office Humidifier',
      status: 'off',
      lastSeen: new Date(),
    });

    this.devices.set('ac-01', {
      id: 'ac-01',
      type: 'air_conditioner',
      name: 'Office AC',
      status: 'off',
      lastSeen: new Date(),
    });

    this.devices.set('purifier-01', {
      id: 'purifier-01',
      type: 'air_purifier',
      name: 'Air Purifier',
      status: 'off',
      lastSeen: new Date(),
    });
  }

  async getAllDevices() {
    return Array.from(this.devices.values());
  }

  async getDevice(deviceId: string) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }
    return device;
  }

  async controlDevice(dto: DeviceControlDto, triggeredBy: string = 'user') {
    const device = await this.getDevice(dto.deviceId);

    try {
      // Log the control action
      const log = await this.prisma.deviceControlLog.create({
        data: {
          deviceId: dto.deviceId,
          deviceType: device.type,
          action: dto.action,
          parameters: dto.parameters || {},
          triggeredBy,
          success: true,
        },
      });

      // Send command via MQTT (if device is MQTT-enabled)
      // For now, we'll just update local state
      this.updateDeviceState(dto.deviceId, dto.action, dto.parameters);

      this.logger.log(`Device ${dto.deviceId} controlled: ${dto.action}`);

      return {
        success: true,
        deviceId: dto.deviceId,
        action: dto.action,
        logId: log.id,
      };
    } catch (error) {
      // Log failed control
      await this.prisma.deviceControlLog.create({
        data: {
          deviceId: dto.deviceId,
          deviceType: device.type,
          action: dto.action,
          parameters: dto.parameters || {},
          triggeredBy,
          success: false,
          errorMessage: error.message,
        },
      });

      this.logger.error(`Failed to control device ${dto.deviceId}: ${error.message}`);
      throw error;
    }
  }

  private updateDeviceState(deviceId: string, action: string, parameters?: any) {
    const device = this.devices.get(deviceId);
    if (!device) return;

    switch (action) {
      case 'turn_on':
        device.status = 'on';
        break;
      case 'turn_off':
        device.status = 'off';
        break;
      case 'set_temperature':
        device.status = `on (${parameters.temperature}°C)`;
        break;
      case 'set_humidity':
        device.status = `on (${parameters.humidity}%)`;
        break;
      case 'set_speed':
        device.status = `on (speed: ${parameters.speed})`;
        break;
    }

    device.lastSeen = new Date();
    this.devices.set(deviceId, device);
  }

  async getControlLogs(deviceId?: string, limit: number = 50) {
    const where: any = {};
    if (deviceId) {
      where.deviceId = deviceId;
    }

    return this.prisma.deviceControlLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getDeviceStatistics(deviceId: string, hours: number = 24) {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const logs = await this.prisma.deviceControlLog.findMany({
      where: {
        deviceId,
        createdAt: {
          gte: startTime,
        },
      },
    });

    const totalCommands = logs.length;
    const successfulCommands = logs.filter((l) => l.success).length;
    const failedCommands = totalCommands - successfulCommands;

    const actionCounts: Record<string, number> = {};
    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    return {
      deviceId,
      period: `${hours} hours`,
      totalCommands,
      successfulCommands,
      failedCommands,
      successRate: totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0,
      actionCounts,
    };
  }
}
