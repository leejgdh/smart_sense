import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional } from 'class-validator';

export class ExecuteToolDto {
  @ApiProperty({ description: 'Name of the tool to execute' })
  @IsString()
  tool: string;

  @ApiProperty({ description: 'Parameters for the tool', required: false })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

export class ToolResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ required: false })
  result?: any;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({ description: 'Execution time in milliseconds' })
  executionTime: number;

  @ApiProperty()
  timestamp: Date;
}

export class AgentQueryDto {
  @ApiProperty({ description: 'Natural language query' })
  @IsString()
  query: string;

  @ApiProperty({ description: 'Optional context for the query', required: false })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}
