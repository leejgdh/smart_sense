import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OllamaClient } from './ollama.client';
import { SensorsModule } from '../sensors/sensors.module';

@Module({
  imports: [ConfigModule, SensorsModule],
  controllers: [AiController],
  providers: [AiService, OllamaClient],
  exports: [AiService],
})
export class AiModule {}
