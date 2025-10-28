import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { AgentInfoDto } from './dto/agent-info.dto';
import { ExecuteToolDto, ToolResultDto, AgentQueryDto } from './dto/execute-tool.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('agent')
@Public()
@Controller('api/agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('info')
  @ApiOperation({ summary: 'Get SmartSense Agent information' })
  @ApiResponse({ status: 200, type: AgentInfoDto })
  getInfo(): AgentInfoDto {
    return this.agentService.getAgentInfo();
  }

  @Get('tools')
  @ApiOperation({ summary: 'Get list of available tools with their schemas' })
  @ApiResponse({ status: 200, description: 'List of tools' })
  getTools() {
    return this.agentService.getTools();
  }

  @Post('execute')
  @ApiOperation({ summary: 'Execute a specific tool' })
  @ApiResponse({ status: 200, type: ToolResultDto })
  async executeTool(@Body() dto: ExecuteToolDto): Promise<ToolResultDto> {
    return this.agentService.executeTool(dto);
  }

  @Post('query')
  @ApiOperation({ summary: 'Process natural language query using AI' })
  @ApiResponse({ status: 200, description: 'AI response to the query' })
  async processQuery(@Body() dto: AgentQueryDto) {
    return this.agentService.processQuery(dto.query, dto.context);
  }
}
