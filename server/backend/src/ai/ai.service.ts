import { Injectable, Logger } from '@nestjs/common';
import { OllamaClient } from './ollama.client';
import { SensorsService } from '../sensors/sensors.service';
import { PrismaService } from '../database/prisma.service';
import { AnalyzeEnvironmentDto, ChatDto } from './dto/ai-request.dto';

export enum InsightType {
  SUMMARY = 'summary',
  ANOMALY = 'anomaly',
  RECOMMENDATION = 'recommendation',
  PREDICTION = 'prediction',
  ALERT = 'alert',
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private ollamaClient: OllamaClient,
    private sensorsService: SensorsService,
    private prisma: PrismaService,
  ) {}

  async analyzeEnvironment(dto: AnalyzeEnvironmentDto) {
    try {
      // Get current sensor values
      const currentValues = await this.sensorsService.getCurrentValues(dto.nodeId);

      // Get statistics for each sensor
      const statistics = await Promise.all(
        currentValues.readings.map((reading) =>
          this.sensorsService.getSensorStatistics(dto.nodeId, reading.sensorType, 24),
        ),
      );

      // Build context for AI
      const context = this.buildEnvironmentContext(currentValues, statistics);

      // Generate analysis with AI
      const prompt = `You are an environmental monitoring AI assistant. Analyze the following sensor data and provide insights:

${context}

Please provide:
1. Overall environmental assessment
2. Any anomalies or concerns
3. Recommendations for improvement
4. Predicted trends

Keep your response concise and actionable.`;

      const analysis = await this.ollamaClient.generate(prompt);

      // Get node for foreign key
      const node = await this.sensorsService.getNode(dto.nodeId);

      // Store insight
      const insight = await this.prisma.aiInsight.create({
        data: {
          insightType: InsightType.SUMMARY,
          title: 'Environment Analysis',
          description: analysis,
          severity: 'info',
          nodeId: node.id,
          metadata: {
            timeRange: dto.timeRange,
            sensorCount: currentValues.readings.length,
          },
        },
      });

      return {
        analysis,
        currentValues: currentValues.readings,
        statistics,
        insightId: insight.id,
      };
    } catch (error) {
      this.logger.error(`Failed to analyze environment: ${error.message}`);
      throw error;
    }
  }

  async chat(dto: ChatDto) {
    try {
      // Build chat context
      const systemPrompt = `You are SmartSense AI, an intelligent environmental monitoring assistant.
You help users understand their sensor data, identify issues, and optimize their environment.
Be helpful, concise, and technical when needed.

You are bilingual and support both Korean and English.
- If the user asks in Korean, respond in Korean.
- If the user asks in English, respond in English.
Always match the language of the user's question.

당신은 한국어와 영어를 모두 지원하는 SmartSense AI입니다.
- 사용자가 한국어로 질문하면 한국어로 답변하세요.
- 사용자가 영어로 질문하면 한국어로 답변하세요.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: dto.message },
      ];

      const response = await this.ollamaClient.chat(messages);

      return {
        message: response,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to chat: ${error.message}`);
      throw error;
    }
  }

  async detectAnomalies(nodeId: string) {
    try {
      // Get sensor types
      const sensorTypes = await this.sensorsService.getSensorTypes(nodeId);

      const anomalies = [];

      // Get node for foreign key
      const node = await this.sensorsService.getNode(nodeId);

      for (const sensor of sensorTypes) {
        const stats = await this.sensorsService.getSensorStatistics(nodeId, sensor.sensorType, 24);

        if (!stats) continue;

        // Simple anomaly detection: check if latest value is > 2 standard deviations from mean
        const latestValue = stats.latest.value;
        const threshold = stats.avg + 2 * stats.stddev;

        if (Math.abs(latestValue - stats.avg) > 2 * stats.stddev) {
          const anomaly = {
            sensorType: sensor.sensorType,
            latestValue,
            average: stats.avg,
            stddev: stats.stddev,
            deviation: Math.abs(latestValue - stats.avg) / stats.stddev,
          };

          anomalies.push(anomaly);

          // Store as insight
          await this.prisma.aiInsight.create({
            data: {
              insightType: InsightType.ANOMALY,
              title: `Anomaly in ${sensor.sensorType}`,
              description: `Anomaly detected in ${sensor.sensorType}: value ${latestValue} deviates significantly from average ${stats.avg}`,
              severity: 'warning',
              nodeId: node.id,
              metadata: anomaly,
            },
          });
        }
      }

      return {
        nodeId: node.id,
        anomalies,
        totalChecked: sensorTypes.length,
        analyzedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to detect anomalies: ${error.message}`);
      throw error;
    }
  }

  async getInsights(nodeId?: string, type?: string, limit: number = 50) {
    const where: any = {};

    if (nodeId) {
      const node = await this.sensorsService.getNode(nodeId);
      where.nodeId = node.id;
    }

    if (type && type !== 'all') {
      where.insightType = type;
    }

    return this.prisma.aiInsight.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markInsightAsRead(insightId: number) {
    await this.prisma.aiInsight.update({
      where: { id: insightId },
      data: { isRead: true },
    });
  }

  private buildEnvironmentContext(currentValues: any, statistics: any[]): string {
    let context = `Node: ${currentValues.node.nodeId}\n`;
    context += `Location: ${currentValues.node.location}\n\n`;

    context += 'Current Readings:\n';
    for (const reading of currentValues.readings) {
      context += `- ${reading.sensorType}: ${reading.value} ${reading.unit || ''}\n`;
    }

    context += '\n24-Hour Statistics:\n';
    for (const stat of statistics) {
      if (!stat) continue;
      context += `- ${stat.sensorType}:\n`;
      context += `  Average: ${stat.avg}, Min: ${stat.min}, Max: ${stat.max}\n`;
      context += `  Std Dev: ${stat.stddev}\n`;
    }

    return context;
  }

  async checkHealth(): Promise<boolean> {
    return this.ollamaClient.checkHealth();
  }
}
