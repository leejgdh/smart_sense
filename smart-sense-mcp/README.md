# SmartSense MCP Client

SmartSense MCP Client는 stdio 형태의 MCP 서버로, SmartSense Backend API를 호출하는 경량 클라이언트입니다.

## 구조

```
Claude Desktop (stdio)
    ↓
SmartSense MCP Client
    ↓ HTTP
SmartSense Backend API (localhost:3000)
```

## 설치

```bash
# 의존성 설치
npm install

# 빌드
npm run build
```

## 사용 방법

### 1. SmartSense Backend 서버 실행

먼저 SmartSense Backend 서버가 실행 중이어야 합니다:

```bash
cd ../server
docker-compose up -d
```

서버가 `http://localhost:3000`에서 실행되는지 확인하세요.

### 2. Claude Desktop 설정

`claude_desktop_config.json` 파일을 수정하세요:

**Windows**:
```json
{
  "mcpServers": {
    "smartsense": {
      "command": "node",
      "args": ["C:/Codes/projects/smart_sense/smart-sense-mcp/dist/index.js"],
      "env": {
        "SMARTSENSE_BACKEND_URL": "http://localhost:3000"
      }
    }
  }
}
```

**macOS/Linux**:
```json
{
  "mcpServers": {
    "smartsense": {
      "command": "node",
      "args": ["/path/to/smart_sense/smart-sense-mcp/dist/index.js"],
      "env": {
        "SMARTSENSE_BACKEND_URL": "http://localhost:3000"
      }
    }
  }
}
```

### 3. Claude Desktop 재시작

설정 변경 후 Claude Desktop을 재시작하세요.

## 환경 변수

- `SMARTSENSE_BACKEND_URL`: SmartSense Backend API URL (기본값: `http://localhost:3000`)

## 제공하는 Tool

이 MCP 클라이언트는 SmartSense Backend의 9개 Tool을 제공합니다:

### 센서 데이터 Tool
1. `get_sensor_nodes` - 모든 센서 노드 목록
2. `get_current_sensor_data` - 현재 센서 값 조회
3. `get_sensor_history` - 과거 데이터 조회
4. `get_sensor_statistics` - 통계 분석

### AI 분석 Tool
5. `analyze_environment` - 환경 분석
6. `detect_anomalies` - 이상 감지
7. `get_ai_insights` - AI 인사이트 조회

### 디바이스 제어 Tool
8. `control_device` - IoT 디바이스 제어
9. `get_device_status` - 디바이스 상태 조회

## 개발

### 개발 모드 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 로그 확인

MCP 클라이언트는 stderr로 로그를 출력합니다. Claude Desktop의 로그에서 확인할 수 있습니다.

## 문제 해결

### Backend 서버에 연결할 수 없음

```
ERROR: Cannot connect to SmartSense Backend at http://localhost:3000
```

**해결**:
1. SmartSense Backend 서버가 실행 중인지 확인
2. `http://localhost:3000/api/agent/info`에 접속 가능한지 확인
3. 방화벽 설정 확인

### Tool 목록을 불러올 수 없음

```
ERROR: Failed to fetch tools from backend
```

**해결**:
1. Backend API가 정상 작동하는지 확인
2. `/api/agent/tools` 엔드포인트 확인

## 라이선스

MIT
