import { Controller, Post, Get, Body, Query, Param, Patch, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AnalyzeEnvironmentDto, ChatDto, GetInsightsDto } from './dto/ai-request.dto';
import {
  AiInsightDto,
  AnalyzeEnvironmentResponseDto,
  ChatResponseDto,
  AnomalyDetectionResponseDto,
  AiHealthResponseDto,
} from './dto/ai-response.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('ai')
@ApiBearerAuth('firebase-auth')
@Controller('api/ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze environment' })
  @ApiBody({ type: AnalyzeEnvironmentDto })
  @ApiResponse({ status: 200, type: AnalyzeEnvironmentResponseDto })
  async analyzeEnvironment(@Body() dto: AnalyzeEnvironmentDto) {
    return this.aiService.analyzeEnvironment(dto);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI' })
  @ApiBody({ type: ChatDto })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  async chat(@Body() dto: ChatDto) {
    return this.aiService.chat(dto);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get AI insights' })
  @ApiResponse({ status: 200, type: [AiInsightDto] })
  async getInsights(@Query() dto: GetInsightsDto) {
    return this.aiService.getInsights(dto.nodeId, dto.type, dto.limit);
  }

  @Patch('insights/:id/read')
  @ApiOperation({ summary: 'Mark insight as read' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, schema: { properties: { success: { type: 'boolean' } } } })
  async markAsRead(@Param('id') id: string) {
    await this.aiService.markInsightAsRead(parseInt(id, 10));
    return { success: true };
  }

  @Post('detect-anomalies/:nodeId')
  @ApiOperation({ summary: 'Detect anomalies' })
  @ApiParam({ name: 'nodeId' })
  @ApiResponse({ status: 200, type: AnomalyDetectionResponseDto })
  async detectAnomalies(@Param('nodeId') nodeId: string) {
    return this.aiService.detectAnomalies(nodeId);
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Check AI service health' })
  @ApiResponse({ status: 200, type: AiHealthResponseDto })
  async checkHealth() {
    const isHealthy = await this.aiService.checkHealth();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
    };
  }
}
