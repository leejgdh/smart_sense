# SmartSense Backend API

NestJS 기반 SmartSense IoT 플랫폼 백엔드 서버

## 개요

SmartSense Backend는 센서 노드로부터 MQTT를 통해 데이터를 수신하고, TimescaleDB에 저장하며, AI 분석을 제공하는 RESTful API 서버입니다.

## 기술 스택

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL + TimescaleDB
- **ORM**: Prisma
- **Authentication**: Firebase Authentication (JWT)
- **MQTT**: paho-mqtt
- **AI**: Ollama (Phi-3)
- **API Documentation**: Swagger/OpenAPI

## 주요 기능

### 1. 인증/인가
- Firebase Authentication 통합
- JWT 토큰 기반 인증
- Google Sign-In 지원
- 전역 Auth Guard 적용
- Agent API는 Public (인증 불필요)

### 2. MQTT 통신
- Sparkplug B 프로토콜 지원
- 센서 노드 자동 등록
- 실시간 데이터 수신 및 저장

### 3. 센서 데이터 관리
- 시계열 데이터 저장 (TimescaleDB)
- 실시간 조회 및 통계
- 집계 쿼리 (시간별, 일별)

### 4. AI 분석
- 환경 데이터 분석
- 이상 감지
- AI 챗봇

### 5. IoT 기기 제어
- 기기 제어 명령
- 제어 로그 관리

### 6. AI Agent 통신
- Agent REST API (9개 Tool 제공)
- MCP (Model Context Protocol) Server
- 다른 AI Agent와 상호작용
- 표준 프로토콜 지원

## 프로젝트 구조

```
src/
├── firebase/              # Firebase Admin SDK
│   ├── firebase.module.ts
│   └── firebase.service.ts
│
├── auth/                  # 인증/인가
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── firebase-auth.strategy.ts
│   ├── firebase-auth.guard.ts
│   └── decorators/
│       ├── public.decorator.ts
│       └── current-user.decorator.ts
│
├── database/              # 데이터베이스
│   └── database.module.ts
│
├── mqtt/                  # MQTT 통신
│   ├── mqtt.service.ts
│   └── dto/
│
├── sensors/               # 센서 관리
│   ├── sensors.controller.ts
│   ├── sensors.service.ts
│   └── dto/
│
├── ai/                    # AI 분석
│   ├── ai.controller.ts
│   ├── ai.service.ts
│   ├── ollama.client.ts
│   └── dto/
│
├── devices/               # IoT 기기 제어
│   ├── devices.controller.ts
│   ├── devices.service.ts
│   └── dto/
│
├── agent/                 # AI Agent API
│   ├── agent.module.ts
│   ├── agent.controller.ts
│   ├── agent.service.ts
│   ├── dto/
│   └── schemas/
│       └── tool-schemas.ts  # 9개 Tool 정의
│
├── mcp/                   # MCP Server
│   ├── mcp.module.ts
│   ├── mcp.controller.ts
│   ├── mcp-server.service.ts
│   ├── dto/
│   └── tools/
│       ├── sensor-tools.handler.ts
│       ├── analysis-tools.handler.ts
│       └── device-tools.handler.ts
│
├── app.module.ts
└── main.ts
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
nano .env
```

필수 설정:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `MQTT_BROKER_URL`: MQTT 브로커 URL
- `OLLAMA_URL`: Ollama 서버 URL
- `FIREBASE_PROJECT_ID`: Firebase 프로젝트 ID
- `FIREBASE_CLIENT_EMAIL`: Firebase 서비스 계정 이메일
- `FIREBASE_PRIVATE_KEY`: Firebase 서비스 계정 Private Key

### 3. 데이터베이스 마이그레이션

```bash
# Prisma 마이그레이션 실행
npx prisma migrate dev

# Prisma Client 생성
npx prisma generate
```

### 4. TimescaleDB 설정

TimescaleDB extension을 활성화하고 hypertable을 생성합니다:

```bash
# 옵션 1: Prisma를 통해 실행
npx prisma db execute --file prisma/timescaledb-setup.sql

# 옵션 2: psql 또는 DBeaver에서 직접 실행
psql -h localhost -U smartsense -d smartsense -f prisma/timescaledb-setup.sql
```

**주의**: 이 단계는 초기 설정 시 한 번만 실행하면 됩니다. TimescaleDB extension이 이미 활성화되어 있다면 건너뛰어도 됩니다.

### 5. 개발 모드 실행

```bash
npm run start:dev
```

### 6. 프로덕션 빌드

```bash
npm run build
npm run start:prod
```

## API 문서

서버 실행 후 Swagger UI에서 모든 API 엔드포인트를 확인하고 테스트할 수 있습니다:

```
http://localhost:3000/api/docs
```

### 인증 방법

모든 API 엔드포인트는 Firebase JWT 토큰으로 보호됩니다.

**Swagger UI에서 테스트:**
1. Firebase Authentication으로 로그인하여 ID Token 획득
2. Swagger UI 우측 상단 "Authorize" 버튼 클릭
3. Firebase ID Token 입력 (Bearer 붙이지 않고 토큰만)
4. "Authorize" 클릭

**프로그래매틱 접근:**
```javascript
const idToken = await firebase.auth().currentUser.getIdToken();

fetch('http://localhost:3000/api/sensors/nodes', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

### 주요 API 모듈

- **Auth API** (`/api/auth`): 인증 및 사용자 정보
- **Sensors API** (`/api/sensors`): 센서 노드 및 데이터 조회
- **AI API** (`/api/ai`): AI 분석 및 챗봇
- **Devices API** (`/api/devices`): IoT 기기 제어 및 로그
- **Agent API** (`/api/agent`): AI Agent 통신 (Public, 인증 불필요)
- **MCP API** (`/api/mcp`): Model Context Protocol (Public, 인증 불필요)

## AI Agent API

SmartSense는 **센서 데이터 전문 AI Agent**로 동작하여 다른 AI 시스템과 통신할 수 있습니다.

### Agent REST API

#### GET /api/agent/info
Agent 기본 정보 조회

```bash
curl http://localhost:3000/api/agent/info
```

**응답**:
```json
{
  "name": "SmartSense Agent",
  "version": "1.0.0",
  "description": "IoT sensor monitoring and analysis specialist AI agent",
  "capabilities": [
    "sensor_reading",
    "sensor_statistics",
    "environment_analysis",
    "anomaly_detection",
    "device_control",
    "ai_insights"
  ],
  "status": "online",
  "timestamp": "2025-10-28T..."
}
```

#### GET /api/agent/tools
사용 가능한 Tool 목록 조회 (JSON Schema 포함)

```bash
curl http://localhost:3000/api/agent/tools
```

#### POST /api/agent/execute
특정 Tool 실행

```bash
curl -X POST http://localhost:3000/api/agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_current_sensor_data",
    "parameters": {
      "nodeId": "NODE001"
    }
  }'
```

**응답**:
```json
{
  "success": true,
  "result": {
    "node": { "nodeId": "NODE001", "name": "Living Room", ... },
    "readings": [
      { "sensorType": "temperature", "value": 23.5, "unit": "°C" },
      { "sensorType": "humidity", "value": 45.2, "unit": "%" }
    ]
  },
  "executionTime": 123,
  "timestamp": "2025-10-28T..."
}
```

#### POST /api/agent/query
자연어 질의 처리

```bash
curl -X POST http://localhost:3000/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "NODE001의 현재 온도는?",
    "context": { "nodeId": "NODE001" }
  }'
```

### 제공하는 9가지 Tool

#### 센서 데이터 Tool
1. **get_sensor_nodes** - 모든 센서 노드 목록
2. **get_current_sensor_data** - 현재 센서 값 조회
3. **get_sensor_history** - 과거 데이터 조회
4. **get_sensor_statistics** - 통계 분석 (평균, 최소, 최대, 표준편차)

#### AI 분석 Tool
5. **analyze_environment** - 환경 분석 및 인사이트 생성
6. **detect_anomalies** - 이상 감지 (통계적 분석)
7. **get_ai_insights** - 이전에 생성된 AI 인사이트 조회

#### 디바이스 제어 Tool
8. **control_device** - IoT 디바이스 제어 (MQTT)
9. **get_device_status** - 디바이스 상태 조회

### MCP (Model Context Protocol)

MCP는 Anthropic이 개발한 AI Agent 간 표준 통신 프로토콜입니다.

#### POST /api/mcp
MCP JSON-RPC 요청 처리

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

#### GET /api/mcp/sse
Server-Sent Events 스트림 (실시간 이벤트)

```bash
curl http://localhost:3000/api/mcp/sse
```

#### GET /api/mcp/info
MCP 서버 정보

```bash
curl http://localhost:3000/api/mcp/info
```

**응답**:
```json
{
  "name": "smartsense-mcp-server",
  "version": "1.0.0",
  "protocol": "Model Context Protocol (MCP)",
  "transport": ["http", "sse"],
  "capabilities": {
    "tools": true,
    "resources": false,
    "prompts": false
  }
}
```

### Claude Desktop MCP 설정 예시

```json
{
  "mcpServers": {
    "smartsense": {
      "url": "http://localhost:3000/api/mcp",
      "transport": "http"
    }
  }
}
```

## 데이터베이스 스키마

데이터베이스 스키마는 Prisma를 통해 관리됩니다. 스키마 파일: `prisma/schema.prisma`

### 주요 테이블

- **sensor_readings** (TimescaleDB Hypertable): 시계열 센서 데이터
- **sensor_nodes**: 센서 노드 정보 및 상태
- **ai_insights**: AI 분석 결과 및 인사이트
- **device_control_logs**: IoT 기기 제어 로그

### 스키마 변경

```bash
# 스키마 수정 후 마이그레이션 생성
npx prisma migrate dev --name <migration_name>

# Prisma Client 재생성
npx prisma generate

# Prisma Studio로 데이터 확인
npx prisma studio
```

## 개발

### 개발 서버 실행

```bash
# Watch mode로 실행 (코드 변경 시 자동 재시작)
npm run start:dev

# 디버그 모드
npm run start:debug
```

### 빌드 및 테스트

```bash
# 빌드
npm run build

# 단위 테스트
npm run test

# e2e 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov

# 린팅
npm run lint

# 코드 포맷팅
npm run format
```

### Prisma 관리

```bash
# Prisma Studio (GUI 데이터 관리)
npx prisma studio

# 마이그레이션 생성
npx prisma migrate dev --name <migration_name>

# 마이그레이션 배포
npx prisma migrate deploy

# 데이터베이스 리셋 (개발 환경)
npx prisma migrate reset

# Prisma Client 생성
npx prisma generate
```

## 문제 해결

### TimescaleDB 관련 오류

**오류**: `relation "timescaledb_information.hypertables" does not exist`

**해결**:
```bash
# TimescaleDB extension 활성화
npx prisma db execute --file prisma/timescaledb-setup.sql
```

**오류**: `function time_bucket(interval, timestamp without time zone) does not exist`

**해결**: 스키마에서 timestamp 타입이 `@db.Timestamptz(3)`으로 설정되어 있는지 확인

### MQTT 연결 실패

```bash
# MQTT 브로커 설정 확인
# .env 파일의 MQTT_BROKER_URL 확인

# 네트워크 연결 테스트
ping <mqtt-broker-host>
```

### 데이터베이스 연결 실패

```bash
# .env 파일의 DATABASE_URL 확인
# 데이터베이스 접속 테스트
psql -h localhost -U smartsense -d smartsense

# Prisma 연결 테스트
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Ollama AI 서비스 연결 실패

```bash
# Ollama 서비스 상태 확인
curl http://localhost:11434/

# 모델 확인
curl http://localhost:11434/api/tags
```

## 성능 최적화

### TimescaleDB 최적화

`prisma/timescaledb-setup.sql` 파일에서 다음 옵션을 활성화할 수 있습니다:

- **압축 정책**: 7일 이상 오래된 데이터 자동 압축
- **보관 정책**: 90일 이상 오래된 데이터 자동 삭제
- **Continuous Aggregates**: 사전 집계된 뷰 생성

### 쿼리 최적화

- 시간 범위를 적절히 제한하여 쿼리
- `points` 파라미터로 반환 데이터 포인트 수 조정
- 특정 센서나 metric만 필요한 경우 필터 사용

## 라이선스

MIT License
