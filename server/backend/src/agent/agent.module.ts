import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { SensorsModule } from '../sensors/sensors.module';
import { AiModule } from '../ai/ai.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [SensorsModule, AiModule, DevicesModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
