import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SensorsService } from '../sensors/sensors.service';
import { AiService } from '../ai/ai.service';
import { DevicesService } from '../devices/devices.service';
import { ALL_TOOLS } from './schemas/tool-schemas';
import { ExecuteToolDto } from './dto/execute-tool.dto';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private sensorsService: SensorsService,
    private aiService: AiService,
    private devicesService: DevicesService,
  ) {}

  getAgentInfo() {
    return {
      name: 'SmartSense Agent',
      version: '1.0.0',
      description: 'IoT sensor monitoring and analysis specialist AI agent',
      capabilities: [
        'sensor_reading',
        'sensor_statistics',
        'environment_analysis',
        'anomaly_detection',
        'device_control',
        'ai_insights',
      ],
      status: 'online',
      timestamp: new Date(),
    };
  }

  getTools() {
    return ALL_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  async executeTool(dto: ExecuteToolDto) {
    const startTime = Date.now();
    this.logger.log(`Executing tool: ${dto.tool} with parameters: ${JSON.stringify(dto.parameters)}`);

    try {
      let result;

      switch (dto.tool) {
        // Sensor Tools
        case 'get_sensor_nodes':
          result = await this.getSensorNodes();
          break;

        case 'get_current_sensor_data':
          result = await this.getCurrentSensorData(dto.parameters);
          break;

        case 'get_sensor_history':
          result = await this.getSensorHistory(dto.parameters);
          break;

        case 'get_sensor_statistics':
          result = await this.getSensorStatistics(dto.parameters);
          break;

        // Analysis Tools
        case 'analyze_environment':
          result = await this.analyzeEnvironment(dto.parameters);
          break;

        case 'detect_anomalies':
          result = await this.detectAnomalies(dto.parameters);
          break;

        case 'get_ai_insights':
          result = await this.getAiInsights(dto.parameters);
          break;

        // Device Tools
        case 'control_device':
          result = await this.controlDevice(dto.parameters);
          break;

        case 'get_device_status':
          result = await this.getDeviceStatus(dto.parameters);
          break;

        default:
          throw new BadRequestException(`Unknown tool: ${dto.tool}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result,
        executionTime,
        timestamp: new Date(),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Tool execution failed: ${error.message}`);

      return {
        success: false,
        error: error.message,
        executionTime,
        timestamp: new Date(),
      };
    }
  }

  // Tool Implementation Methods

  private async getSensorNodes() {
    return this.sensorsService.getNodes();
  }

  private async getCurrentSensorData(params: any) {
    if (!params?.nodeId) {
      throw new BadRequestException('nodeId is required');
    }

    const data = await this.sensorsService.getCurrentValues(params.nodeId);

    // Filter by sensorType if provided
    if (params.sensorType) {
      data.readings = data.readings.filter((r) => r.sensorType === params.sensorType);
    }

    return data;
  }

  private async getSensorHistory(params: any) {
    if (!params?.nodeId) {
      throw new BadRequestException('nodeId is required');
    }

    const query: any = {
      nodeId: params.nodeId,
      limit: params.limit || 100,
    };

    if (params.sensorType) {
      query.sensorType = params.sensorType;
    }

    if (params.startTime) {
      query.startTime = new Date(params.startTime);
    }

    if (params.endTime) {
      query.endTime = new Date(params.endTime);
    }

    return this.sensorsService.getReadings(query);
  }

  private async getSensorStatistics(params: any) {
    if (!params?.nodeId || !params?.sensorType) {
      throw new BadRequestException('nodeId and sensorType are required');
    }

    const hours = params.hours || 24;
    return this.sensorsService.getSensorStatistics(params.nodeId, params.sensorType, hours);
  }

  private async analyzeEnvironment(params: any) {
    if (!params?.nodeId) {
      throw new BadRequestException('nodeId is required');
    }

    return this.aiService.analyzeEnvironment({
      nodeId: params.nodeId,
      timeRange: params.timeRange || '24 hours',
    });
  }

  private async detectAnomalies(params: any) {
    if (!params?.nodeId) {
      throw new BadRequestException('nodeId is required');
    }

    return this.aiService.detectAnomalies(params.nodeId);
  }

  private async getAiInsights(params: any) {
    return this.aiService.getInsights(params?.nodeId, params?.type, params?.limit || 50);
  }

  private async controlDevice(params: any) {
    if (!params?.deviceId || !params?.command) {
      throw new BadRequestException('deviceId and command are required');
    }

    return this.devicesService.controlDevice({
      deviceId: params.deviceId,
      action: params.command,
      parameters: params.value ? { value: params.value } : undefined,
    });
  }

  private async getDeviceStatus(params: any) {
    if (params?.deviceId) {
      return this.devicesService.getDevice(params.deviceId);
    }

    return this.devicesService.getAllDevices();
  }

  async processQuery(query: string, context?: Record<string, any>) {
    // Use AI service to process natural language query
    const aiResponse = await this.aiService.chat({
      message: query,
      context: context ? [JSON.stringify(context)] : undefined,
    });

    return aiResponse;
  }
}
