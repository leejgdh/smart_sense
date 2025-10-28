import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { DeviceControlDto } from './dto/device-control.dto';
import {
  DeviceDto,
  DeviceControlResponseDto,
  DeviceControlLogDto,
  DeviceStatisticsDto,
} from './dto/device-response.dto';

@ApiTags('devices')
@ApiBearerAuth('firebase-auth')
@Controller('api/devices')
export class DevicesController {
  private readonly logger = new Logger(DevicesController.name);

  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all devices' })
  @ApiResponse({ status: 200, type: [DeviceDto] })
  async getAllDevices() {
    return this.devicesService.getAllDevices();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: DeviceDto })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getDevice(@Param('id') id: string) {
    return this.devicesService.getDevice(id);
  }

  @Post('control')
  @ApiOperation({ summary: 'Control device' })
  @ApiBody({ type: DeviceControlDto })
  @ApiResponse({ status: 200, type: DeviceControlResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid control command' })
  async controlDevice(@Body() dto: DeviceControlDto) {
    return this.devicesService.controlDevice(dto);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get device logs' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, type: [DeviceControlLogDto] })
  async getDeviceLogs(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.devicesService.getControlLogs(id, limit);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get device statistics' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'hours', required: false })
  @ApiResponse({ status: 200, type: DeviceStatisticsDto })
  async getDeviceStatistics(@Param('id') id: string, @Query('hours') hours?: number) {
    return this.devicesService.getDeviceStatistics(id, hours || 24);
  }
}
