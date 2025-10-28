export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export const SENSOR_TOOLS: ToolSchema[] = [
  {
    name: 'get_sensor_nodes',
    description: 'Get list of all available sensor nodes with their status and location',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_current_sensor_data',
    description: 'Get current sensor readings from a specific node',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: "Sensor node ID (e.g., 'NODE001')",
        },
        sensorType: {
          type: 'string',
          description: "Type of sensor (optional). e.g., 'temperature', 'humidity'",
          enum: ['temperature', 'humidity', 'pressure', 'light', 'co2', 'tvoc'],
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'get_sensor_history',
    description: 'Get historical sensor data with time range',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: "Sensor node ID (e.g., 'NODE001')",
        },
        sensorType: {
          type: 'string',
          description: 'Type of sensor (optional)',
        },
        startTime: {
          type: 'string',
          format: 'date-time',
          description: 'Start time in ISO 8601 format',
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: 'End time in ISO 8601 format',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of records to return',
          default: 100,
          maximum: 1000,
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'get_sensor_statistics',
    description: 'Get statistical analysis (avg, min, max, stddev) for sensor data',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: "Sensor node ID (e.g., 'NODE001')",
        },
        sensorType: {
          type: 'string',
          description: 'Type of sensor',
        },
        hours: {
          type: 'number',
          description: 'Number of hours to analyze',
          default: 24,
        },
      },
      required: ['nodeId', 'sensorType'],
    },
  },
];

export const ANALYSIS_TOOLS: ToolSchema[] = [
  {
    name: 'analyze_environment',
    description: 'Run AI analysis on environmental sensor data to get insights and recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: "Sensor node ID (e.g., 'NODE001')",
        },
        timeRange: {
          type: 'string',
          description: 'Time range to analyze',
          default: '24 hours',
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'detect_anomalies',
    description: 'Detect anomalies in sensor data using statistical analysis',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: "Sensor node ID (e.g., 'NODE001')",
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'get_ai_insights',
    description: 'Get previously generated AI insights and recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'Filter by sensor node ID (optional)',
        },
        type: {
          type: 'string',
          description: 'Filter by insight type',
          enum: ['all', 'summary', 'anomaly', 'recommendation', 'prediction', 'alert'],
          default: 'all',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of insights to return',
          default: 50,
          maximum: 1000,
        },
      },
      required: [],
    },
  },
];

export const DEVICE_TOOLS: ToolSchema[] = [
  {
    name: 'control_device',
    description: 'Send control command to IoT device via MQTT',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          description: "Device ID (e.g., 'DEVICE001')",
        },
        command: {
          type: 'string',
          description: "Command to send (e.g., 'turn_on', 'turn_off', 'set_value')",
        },
        value: {
          type: 'any',
          description: 'Optional value for the command',
        },
      },
      required: ['deviceId', 'command'],
    },
  },
  {
    name: 'get_device_status',
    description: 'Get current status of IoT devices',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          description: 'Filter by device ID (optional)',
        },
      },
      required: [],
    },
  },
];

export const ALL_TOOLS: ToolSchema[] = [...SENSOR_TOOLS, ...ANALYSIS_TOOLS, ...DEVICE_TOOLS];
