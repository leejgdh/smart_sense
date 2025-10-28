import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { MqttModule } from './mqtt/mqtt.module';
import { SensorsModule } from './sensors/sensors.module';
import { AiModule } from './ai/ai.module';
import { DevicesModule } from './devices/devices.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { AgentModule } from './agent/agent.module';
import { FirebaseAuthGuard } from './auth/firebase-auth.guard';
import { MdnsService } from './common/mdns.service';

// Conditionally provide MdnsService only in production
const mdnsProvider = process.env.NODE_ENV === 'production' ? [MdnsService] : [];

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    DatabaseModule,

    // Authentication
    FirebaseModule,
    AuthModule,

    // Feature modules
    MqttModule,
    SensorsModule,
    AiModule,
    DevicesModule,

    // Agent module
    AgentModule,
  ],
  providers: [
    ...mdnsProvider,
    // Apply Firebase Auth Guard globally to all routes
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
})
export class AppModule {}
