import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV !== 'production') {
      // @ts-ignore
      this.$on('query', (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // @ts-ignore
    this.$on('error', (e: any) => {
      this.logger.error(`Prisma Error: ${e.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL database via Prisma');

      // Enable TimescaleDB hypertable for sensor_readings if not already enabled
      await this.enableTimescaleDB();
    } catch (error) {
      this.logger.error(`Failed to connect to database: ${(error as any).message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  private async enableTimescaleDB() {
    try {
      // Check if hypertable already exists
      const result = await this.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM timescaledb_information.hypertables
          WHERE hypertable_name = 'sensor_readings'
        ) as exists;
      `;

      if (!result[0]?.exists) {
        // Create hypertable
        await this.$executeRaw`
          SELECT create_hypertable('sensor_readings', 'timestamp', if_not_exists => TRUE);
        `;
        this.logger.log('Created TimescaleDB hypertable for sensor_readings');
      } else {
        this.logger.log('TimescaleDB hypertable already exists for sensor_readings');
      }
    } catch (error) {
      this.logger.warn(`Could not enable TimescaleDB hypertable: ${(error as any).message}`);
      // Don't throw - TimescaleDB is optional enhancement
    }
  }
}
