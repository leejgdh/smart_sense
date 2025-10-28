#!/usr/bin/env node

/**
 * SmartSense MCP Client
 *
 * stdio 형태의 MCP 서버로, SmartSense Backend API를 호출하는 경량 클라이언트입니다.
 *
 * 구조:
 * Claude Desktop (stdio) → MCP Client → HTTP → SmartSense Backend API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

// Backend API URL (환경 변수로 설정 가능)
const BACKEND_URL = process.env.SMARTSENSE_BACKEND_URL || 'http://localhost:3000';

/**
 * SmartSense Backend API 클라이언트
 */
class SmartSenseApiClient {
  private client: AxiosInstance;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Backend에서 사용 가능한 Tool 목록 가져오기
   */
  async getTools(): Promise<Tool[]> {
    const response = await this.client.get('/api/agent/tools');
    return response.data;
  }

  /**
   * Backend에서 Tool 실행
   */
  async executeTool(toolName: string, parameters: any): Promise<any> {
    const response = await this.client.post('/api/agent/execute', {
      tool: toolName,
      parameters: parameters || {},
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Tool execution failed');
    }

    return response.data.result;
  }

  /**
   * Backend 서버 상태 확인
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/agent/info');
      return response.data.status === 'online';
    } catch (error) {
      return false;
    }
  }
}

/**
 * MCP Server 초기화 및 실행
 */
async function main() {
  const apiClient = new SmartSenseApiClient(BACKEND_URL);

  // Backend 서버 연결 확인
  console.error('Connecting to SmartSense Backend...');
  const isHealthy = await apiClient.checkHealth();
  if (!isHealthy) {
    console.error(`ERROR: Cannot connect to SmartSense Backend at ${BACKEND_URL}`);
    console.error('Please make sure the backend server is running.');
    process.exit(1);
  }
  console.error('✓ Connected to SmartSense Backend');

  // MCP Server 생성
  const server = new Server(
    {
      name: 'smart-sense-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * tools/list - 사용 가능한 Tool 목록 반환
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
      const tools = await apiClient.getTools();
      console.error(`✓ Loaded ${tools.length} tools from backend`);
      return { tools };
    } catch (error: any) {
      console.error('ERROR: Failed to fetch tools from backend:', error.message);
      throw error;
    }
  });

  /**
   * tools/call - Tool 실행
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    console.error(`→ Executing tool: ${name}`);

    try {
      const result = await apiClient.executeTool(name, args);

      console.error(`✓ Tool executed successfully: ${name}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error(`✗ Tool execution failed: ${name}`, error.message);

      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool '${name}': ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  // stdio Transport로 MCP 서버 실행
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('SmartSense MCP Client is running (stdio mode)');
  console.error(`Backend URL: ${BACKEND_URL}`);
}

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 실행
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
