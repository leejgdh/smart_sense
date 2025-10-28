import { IsOptional, IsString, IsDateString, IsInt, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SensorQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nodeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sensorType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 1000, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 100;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class AggregateQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nodeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sensorType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ default: '1 hour' })
  @IsOptional()
  @IsString()
  interval?: string = '1 hour';
}

export class ChartQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sensorType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metricName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ default: 24, description: 'Hours to look back (supports decimal values, e.g., 0.25 for 15min, 0.5 for 30min)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  hours?: number = 24;

  @ApiPropertyOptional({ minimum: 10, maximum: 1000, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(1000)
  points?: number = 100;

  @ApiPropertyOptional({
    default: false,
    description: 'If true, returns raw data without time_bucket aggregation (for real-time charts)'
  })
  @IsOptional()
  @Type(() => Boolean)
  realtime?: boolean = false;
}
