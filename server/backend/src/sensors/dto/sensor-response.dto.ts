import { ApiProperty } from '@nestjs/swagger';

export class SensorNodeDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nodeId: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  lastSeenAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SensorReadingDto {
  @ApiProperty()
  nodeId: number;

  @ApiProperty()
  sensorType: string;

  @ApiProperty()
  metricName: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  timestamp: Date;
}

export class CurrentValueDto {
  @ApiProperty()
  metricName: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  timestamp: Date;
}

export class SensorStatisticsDto {
  @ApiProperty()
  sensorType: string;

  @ApiProperty()
  min: number;

  @ApiProperty()
  max: number;

  @ApiProperty()
  avg: number;

  @ApiProperty()
  count: number;
}

export class AggregatedDataPointDto {
  @ApiProperty()
  bucket: Date;

  @ApiProperty()
  avg: number;

  @ApiProperty()
  min: number;

  @ApiProperty()
  max: number;

  @ApiProperty()
  count: number;
}

export class ChartDataPointDto {
  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  value: number;
}

export class SensorChartDataDto {
  @ApiProperty()
  metricName: string;

  @ApiProperty()
  sensorType: string;

  @ApiProperty()
  unit: string;

  @ApiProperty({ type: [ChartDataPointDto] })
  data: ChartDataPointDto[];
}

export class NodeChartDataDto {
  @ApiProperty()
  nodeId: string;

  @ApiProperty()
  nodeName: string;

  @ApiProperty({ type: [SensorChartDataDto] })
  sensors: SensorChartDataDto[];
}
