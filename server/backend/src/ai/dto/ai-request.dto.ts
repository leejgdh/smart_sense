import { IsString, IsOptional, IsArray, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeEnvironmentDto {
  @ApiProperty()
  @IsString()
  nodeId: string;

  @ApiPropertyOptional({ default: '24 hours' })
  @IsOptional()
  @IsString()
  timeRange?: string = '24 hours';
}

export class ChatDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  context?: string[];
}

export class GetInsightsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nodeId?: string;

  @ApiPropertyOptional({ enum: ['all', 'summary', 'anomaly', 'recommendation', 'prediction', 'alert'], default: 'all' })
  @IsOptional()
  @IsString()
  type?: string = 'all';

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 50;
}
