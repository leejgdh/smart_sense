import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SensorsService } from './sensors.service';
import { SensorQueryDto, AggregateQueryDto, ChartQueryDto } from './dto/sensor-query.dto';
import {
  SensorNodeDto,
  SensorReadingDto,
  CurrentValueDto,
  SensorStatisticsDto,
  AggregatedDataPointDto,
  NodeChartDataDto,
} from './dto/sensor-response.dto';

@ApiTags('sensors')
@ApiBearerAuth('firebase-auth')
@Controller('api/sensors')
export class SensorsController {
  private readonly logger = new Logger(SensorsController.name);

  constructor(private readonly sensorsService: SensorsService) {}

  @Get('nodes')
  @ApiOperation({ summary: 'Get all sensor nodes' })
  @ApiResponse({ status: 200, type: [SensorNodeDto] })
  async getNodes() {
    return this.sensorsService.getNodes();
  }

  @Get('nodes/:nodeId')
  @ApiOperation({ summary: 'Get sensor node by ID' })
  @ApiParam({ name: 'nodeId' })
  @ApiResponse({ status: 200, type: SensorNodeDto })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async getNode(@Param('nodeId') nodeId: string) {
    return this.sensorsService.getNode(nodeId);
  }

  @Get('nodes/:nodeId/current')
  @ApiOperation({ summary: 'Get current sensor values' })
  @ApiParam({ name: 'nodeId' })
  @ApiResponse({ status: 200, type: [CurrentValueDto] })
  async getCurrentValues(@Param('nodeId') nodeId: string) {
    return this.sensorsService.getCurrentValues(nodeId);
  }

  @Get('nodes/:nodeId/types')
  @ApiOperation({ summary: 'Get sensor types' })
  @ApiParam({ name: 'nodeId' })
  @ApiResponse({ status: 200, type: [String] })
  async getSensorTypes(@Param('nodeId') nodeId: string) {
    return this.sensorsService.getSensorTypes(nodeId);
  }

  @Get('nodes/:nodeId/sensors/:sensorType/statistics')
  @ApiOperation({ summary: 'Get sensor statistics' })
  @ApiParam({ name: 'nodeId' })
  @ApiParam({ name: 'sensorType' })
  @ApiQuery({ name: 'hours', required: false })
  @ApiResponse({ status: 200, type: SensorStatisticsDto })
  async getSensorStatistics(
    @Param('nodeId') nodeId: string,
    @Param('sensorType') sensorType: string,
    @Query('hours') hours?: number,
  ) {
    return this.sensorsService.getSensorStatistics(nodeId, sensorType, hours || 24);
  }

  @Get('readings')
  @ApiOperation({ summary: 'Get sensor readings' })
  @ApiResponse({ status: 200, type: [SensorReadingDto] })
  async getReadings(@Query() query: SensorQueryDto) {
    return this.sensorsService.getReadings(query);
  }

  @Get('aggregate')
  @ApiOperation({ summary: 'Get aggregated data' })
  @ApiResponse({ status: 200, type: [AggregatedDataPointDto] })
  async getAggregatedData(@Query() query: AggregateQueryDto) {
    return this.sensorsService.getAggregatedData(query);
  }

  @Get('nodes/:nodeId/chart')
  @ApiOperation({
    summary: 'Get chart data for sensors on a node with flexible filtering',
    description:
      'Use realtime=true for real-time charts to get raw data without time_bucket aggregation',
  })
  @ApiParam({ name: 'nodeId' })
  @ApiQuery({ name: 'sensorType', required: false })
  @ApiQuery({ name: 'metricName', required: false })
  @ApiQuery({ name: 'startTime', required: false })
  @ApiQuery({ name: 'endTime', required: false })
  @ApiQuery({ name: 'hours', required: false })
  @ApiQuery({ name: 'points', required: false })
  @ApiQuery({
    name: 'realtime',
    required: false,
    type: Boolean,
    description: 'If true, returns raw data without aggregation',
  })
  @ApiResponse({ status: 200, type: NodeChartDataDto })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async getChartData(@Param('nodeId') nodeId: string, @Query() query: ChartQueryDto) {
    return this.sensorsService.getChartData(
      nodeId,
      query.sensorType,
      query.metricName,
      query.startTime,
      query.endTime,
      query.hours || 24,
      query.points || 100,
      query.realtime || false,
    );
  }
}
