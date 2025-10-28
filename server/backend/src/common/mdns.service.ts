import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

// Type definitions for zeroconf
interface ServiceOptions {
  name: string;
  type: string;
  port: number;
  txt?: Record<string, string>;
}

@Injectable()
export class MdnsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MdnsService.name);
  private zeroconf: any;
  private service: any;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Skip mDNS in development (Windows) environment
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv === 'development') {
      this.logger.log('mDNS service disabled in development mode');
      return;
    }

    await this.registerService();
  }

  async onModuleDestroy() {
    await this.unregisterService();
  }

  private async registerService() {
    try {
      // Dynamically import zeroconf (optional dependency)
      // @ts-ignore - zeroconf is optional and may not be installed
      const { Zeroconf } = await import('zeroconf');

      const hostname = os.hostname();
      const port = this.configService.get('PORT', 3000);
      const mqttPort = this.configService.get('MQTT_PORT', 1883);

      this.zeroconf = new Zeroconf();

      const serviceOptions: ServiceOptions = {
        name: `SmartSense Server (${hostname})`,
        type: '_smartsense._tcp',
        port: port,
        txt: {
          mqtt_port: mqttPort.toString(),
          api_port: port.toString(),
          version: '1.0.0',
        },
      };

      this.logger.log('Registering mDNS service...');
      this.logger.log(`Service name: ${serviceOptions.name}`);
      this.logger.log(`Service type: ${serviceOptions.type}`);
      this.logger.log(`API port: ${port}`);
      this.logger.log(`MQTT port: ${mqttPort}`);

      this.service = this.zeroconf.publish(serviceOptions);

      this.logger.log('✓ mDNS service registered successfully');
      this.logger.log('Sensor nodes can now auto-discover this server');
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        this.logger.warn('zeroconf module not installed');
        this.logger.warn('Install with: npm install zeroconf');
        this.logger.warn('mDNS service disabled');
      } else {
        this.logger.error(`Failed to register mDNS service: ${error.message}`);
      }
    }
  }

  private async unregisterService() {
    if (this.service) {
      try {
        await this.service.stop();
        this.logger.log('mDNS service unregistered');
      } catch (error: any) {
        this.logger.error(`Failed to unregister mDNS service: ${error.message}`);
      }
    }

    if (this.zeroconf) {
      try {
        await this.zeroconf.destroy();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  getServiceInfo() {
    return {
      registered: !!this.service,
      name: this.service?.name,
      type: this.service?.type,
      port: this.service?.port,
    };
  }
}
