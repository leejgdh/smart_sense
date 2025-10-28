import { ApiProperty } from '@nestjs/swagger';

export class AgentInfoDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  capabilities: string[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  timestamp: Date;
}
