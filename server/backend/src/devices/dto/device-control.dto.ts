import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeviceControlDto {
  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiProperty()
  @IsString()
  action: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}
