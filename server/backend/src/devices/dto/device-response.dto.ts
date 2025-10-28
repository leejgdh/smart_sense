import { ApiProperty } from '@nestjs/swagger';

export class DeviceDto {
  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  deviceType: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  isOnline: boolean;

  @ApiProperty()
  currentState: string;

  @ApiProperty()
  parameters: Record<string, any>;

  @ApiProperty()
  lastUpdated: Date;
}

export class DeviceControlResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  timestamp: Date;
}

export class DeviceControlLogDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ required: false })
  nodeId?: number;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  deviceType: string;

  @ApiProperty()
  action: string;

  @ApiProperty({ required: false })
  parameters?: any;

  @ApiProperty()
  triggeredBy: string;

  @ApiProperty()
  success: boolean;

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty()
  createdAt: Date;
}

export class DeviceStatisticsDto {
  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  totalCommands: number;

  @ApiProperty()
  successfulCommands: number;

  @ApiProperty()
  failedCommands: number;

  @ApiProperty()
  successRate: number;

  @ApiProperty()
  actionBreakdown: Record<string, number>;

  @ApiProperty()
  lastAction: Date;
}
