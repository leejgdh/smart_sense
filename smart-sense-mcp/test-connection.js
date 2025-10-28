#!/usr/bin/env node

/**
 * SmartSense Backend 연결 테스트 스크립트
 */

import axios from 'axios';

const BACKEND_URL = process.env.SMARTSENSE_BACKEND_URL || 'http://localhost:3000';

async function testConnection() {
  console.log('Testing connection to SmartSense Backend...');
  console.log(`URL: ${BACKEND_URL}\n`);

  try {
    // 1. Agent Info 조회
    console.log('1. Testing /api/agent/info...');
    const infoResponse = await axios.get(`${BACKEND_URL}/api/agent/info`);
    console.log('✓ Agent Info:', infoResponse.data);
    console.log();

    // 2. Tools 목록 조회
    console.log('2. Testing /api/agent/tools...');
    const toolsResponse = await axios.get(`${BACKEND_URL}/api/agent/tools`);
    console.log(`✓ Found ${toolsResponse.data.length} tools:`);
    toolsResponse.data.forEach((tool) => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // 3. Tool 실행 테스트 (센서 노드 목록)
    console.log('3. Testing tool execution (get_sensor_nodes)...');
    const executeResponse = await axios.post(`${BACKEND_URL}/api/agent/execute`, {
      tool: 'get_sensor_nodes',
      parameters: {},
    });
    console.log('✓ Tool execution result:', executeResponse.data);
    console.log();

    console.log('✅ All tests passed! Backend is ready for MCP client.');
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testConnection();
