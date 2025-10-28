import { ApiProperty } from '@nestjs/swagger';

export class AiInsightDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nodeId: number;

  @ApiProperty()
  insightType: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  severity: string;

  @ApiProperty({ required: false })
  metadata?: any;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class AnalyzeEnvironmentResponseDto {
  @ApiProperty()
  analysis: string;

  @ApiProperty({ type: [Object] })
  currentValues: any[];

  @ApiProperty({ type: [Object] })
  statistics: any[];

  @ApiProperty()
  insightId: number;
}

export class ChatResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  timestamp: Date;
}

export class AnomalyDto {
  @ApiProperty()
  sensorType: string;

  @ApiProperty()
  metricName: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  expectedValue: number;

  @ApiProperty()
  confidence: number;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  reason: string;
}

export class AnomalyDetectionResponseDto {
  @ApiProperty()
  nodeId: number;

  @ApiProperty({ type: [AnomalyDto] })
  anomalies: AnomalyDto[];

  @ApiProperty()
  totalChecked: number;

  @ApiProperty()
  analyzedAt: Date;
}

export class AiHealthResponseDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  timestamp: Date;
}
