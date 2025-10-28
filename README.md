# 스마트 센스 (SmartSense) 프로젝트

## 📌 프로젝트 개요

### 프로젝트 목적

**스마트 센스**는 가정, 사무실, 상업 공간 등의 실내 환경을 실시간으로 모니터링하고, 로컬 AI가 데이터를 분석하여 쾌적한 환경을 유지하도록 돕는 스마트 홈 IoT 플랫폼입니다.

#### 핵심 목표

1. **실시간 환경 모니터링**
   - 온도, 습도, CO2, 미세먼지 등 공기질 측정
   - 1분마다 자동으로 환경 데이터 수집
   - 여러 방에 센서 노드 설치 가능

2. **AI 기반 환경 분석**
   - 수집된 데이터의 패턴 분석
   - 공기질 저하 감지 및 알림
   - 환경 개선을 위한 실용적인 제안
   - 자연어로 현재 환경 상태 설명

3. **스마트 기기 자동 제어**
   - 환경 조건에 따라 자동으로 기기 제어
   - 가습기, 에어컨, 공기청정기 등 연동
   - 에너지 효율적인 운영

4. **데이터 관리 및 확장성**
   - MQTT 프로토콜로 안정적인 통신
   - REST API로 다른 스마트홈 시스템과 연동
   - 시계열 데이터베이스로 장기간 데이터 보관 및 분석

5. **프라이버시 중심 설계**
   - 모든 데이터와 AI는 로컬에서 처리
   - 클라우드 없이도 완전한 기능 동작
   - 개인 정보 외부 유출 없음

### 활용 사례

- **가정**: 거실, 침실, 서재 등 각 방의 공기질 관리
- **사무실**: 업무 공간의 쾌적한 환경 유지
- **카페/식당**: 손님을 위한 최적의 실내 환경 제공
- **스터디 카페**: 집중력 향상을 위한 공기질 관리
- **펫 샵/동물병원**: 반려동물을 위한 환경 모니터링

### 차별화 포인트

1. **분산 센서 아키텍처**
   - 센서 노드: 저렴한 라즈베리파이로 데이터 수집
   - AI 서버: 한 대의 미니 PC로 모든 노드 관리
   - 방마다 센서 추가 가능

2. **로컬 AI 처리**
   - 개인 서버에서 AI 실행 (프라이버시 보호)
   - 인터넷 없이도 동작
   - 빠른 응답 속도

3. **표준 프로토콜 사용**
   - MQTT로 안정적인 통신
   - REST API로 홈 어시스턴트 등 연동 가능
   - 오픈소스 기반

4. **확장 가능한 설계**
   - 센서 노드 자유롭게 추가/제거
   - 다양한 센서 타입 지원
   - 모듈식 구조로 커스터마이징 용이

---

## 🏗️ 시스템 아키텍처

### 전체 구성도

```
┌─────────────────────────────────────────────────────┐
│  센서 노드 (라즈베리파이 4) - 여러 위치 배치         │
├─────────────────────────────────────────────────────┤
│  역할: 순수 데이터 수집 장치                         │
│                                                      │
│  하드웨어:                                           │
│  - 라즈베리파이 4 (4GB)                              │
│  - 센서들 (BME680, SCD40, PMS5003 등)               │
│  - 상태 LED (RGB)                                   │
│  - 소형 부저 (긴급 알림)                             │
│                                                      │
│  소프트웨어:                                         │
│  - Python 3.11                                      │
│  - MQTT Client (paho-mqtt)                         │
│  - 센서 드라이버                                     │
│                                                      │
│  기능:                                               │
│  ✓ 센서 데이터 수집 (1분마다)                        │
│  ✓ MQTT로 AI 서버에 전송                            │
│  ✓ 긴급 상황 로컬 알림 (LED, 부저)                  │
│                                                      │
│  비용: $110-180 per 노드                            │
└────────────────┬────────────────────────────────────┘
                 │
                 │ MQTT over WiFi/Ethernet
                 │
┌────────────────▼────────────────────────────────────┐
│  AI Agent 서버 (미니 PC / NUC)                       │
├─────────────────────────────────────────────────────┤
│  역할: 지능형 중앙 허브 + AI Agent + 사용자 인터페이스│
│                                                      │
│  하드웨어:                                           │
│  - Intel NUC / 미니 PC                              │
│  - 16-32GB RAM                                      │
│  - 512GB+ SSD                                       │
│                                                      │
│  소프트웨어 (Docker 컨테이너):                       │
│  1. PostgreSQL + TimescaleDB (데이터 저장)          │
│  2. Mosquitto (MQTT Broker)                        │
│  3. Backend API (NestJS + TypeScript)              │
│  4. Ollama (AI Agent - Phi-3)                      │
│  5. Frontend (Next.js + TypeScript)                │
│  6. Nginx (Reverse Proxy)                          │
│                                                      │
│  기능:                                               │
│  ✓ 모든 센서 노드 데이터 수집                        │
│  ✓ AI 분석 & 인사이트 생성                          │
│  ✓ 웹 인터페이스 제공                                │
│  ✓ IoT 기기 중앙 제어                               │
│  ✓ REST API 제공                                    │
│  ✓ AI Agent 통신 (Agent API + MCP)                 │
│  ✓ 다른 AI와 상호작용                               │
│                                                      │
│  비용: $500-800                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 하드웨어 구성

### 센서 노드 (라즈베리파이 4)

#### 하드웨어 BOM

| 항목 | 제품 | 가격 |
|------|------|------|
| 메인 보드 | Raspberry Pi 4 Model B (4GB) | $55 |
| 저장소 | 128GB microSD Card (A2) | $15 |
| 전원 | 공식 파워 어댑터 (15W) | $10 |
| 케이스 | 통풍 케이스 | $10 |
| **필수 센서** | BME680 (온습도, 기압, VOC) | $18 |
| **옵션 센서** | SCD40 (CO2) | $45 |
| | PMS5003 (미세먼지) | $18 |
| | BH1750 (조도) | $3 |
| | PIR (모션) | $3 |
| **출력** | RGB LED | $2 |
| | 부저 | $2 |
| 기타 | 점퍼 와이어, 브레드보드 | $5 |
| **합계** | 기본 (온습도만) | **$110** |
| | 표준 (온습도+CO2) | **$155** |
| | 풀옵션 (모든 센서) | **$185** |

#### 센서 연결 구성

```
Raspberry Pi 4 GPIO:
├─ I2C (GPIO 2, 3)
│  ├─ BME680 (0x76 또는 0x77)
│  ├─ SCD40 (0x62)
│  └─ BH1750 (0x23)
│
├─ UART (GPIO 14, 15)
│  └─ PMS5003 (미세먼지)
│
├─ GPIO (일반)
│  ├─ PIR 센서 (GPIO 17)
│  ├─ RGB LED (GPIO 18 - PWM)
│  └─ 부저 (GPIO 27)
│
└─ 전원 (5V, GND)
```

### AI Agent 서버

#### 하드웨어 옵션

**추천: Intel NUC 또는 유사 미니 PC**

| 항목 | 사양 | 가격 |
|------|------|------|
| 모델 | Intel NUC 13 Pro (예시) | |
| CPU | Intel i5-1340P (12코어) | |
| RAM | 32GB DDR4 | |
| Storage | 1TB NVMe SSD | |
| GPU | Intel Iris Xe (내장) | |
| 크기 | 11.7 x 11.2 x 5.1cm | |
| 소음 | 거의 없음 | |
| 전력 | 15-30W | |
| **합계** | | **~$600** |

---

## 💻 소프트웨어 스택

### 센서 노드 (라즈베리파이)

```yaml
OS:
  - Raspberry Pi OS Lite (GUI 없음)

언어:
  - Python 3.11

주요 라이브러리:
  - paho-mqtt: MQTT 통신
  - smbus2: I2C 센서 통신
  - pyserial: UART 센서 통신
  - RPi.GPIO: GPIO 제어

메모리 사용량: ~500MB
```

### AI Agent 서버 (Docker 기반)

#### 1. PostgreSQL + TimescaleDB

```yaml
이미지: timescale/timescaledb:latest-pg16
포트: 5432
용도: 
  - 시계열 센서 데이터 저장
  - 장기 히스토리 관리
  - AI 분석용 데이터 조회
```

#### 2. Mosquitto (MQTT Broker)

```yaml
이미지: eclipse-mosquitto:latest
포트: 
  - 1883 (MQTT)
  - 9001 (WebSocket)
용도:
  - 센서 노드 ↔ AI 서버 통신
  - 실시간 데이터 스트림
  - AI Agent 간 통신
```

#### 3. Backend API (NestJS)

```yaml
언어: TypeScript
프레임워크: NestJS
ORM: Prisma
포트: 3000

주요 모듈:
  - Firebase Module: Firebase Admin SDK 초기화
  - Auth Module: Firebase JWT 인증/인가
  - MQTT Module: MQTT 메시지 수신/발행
  - Sensors Module: 센서 데이터 관리
  - AI Module: AI 에이전트 연동
  - Devices Module: IoT 기기 제어
  - Database Module: Prisma 기반 DB 연결

기능:
  - REST API 제공 (Swagger 문서화)
  - Firebase Authentication 통합
  - MQTT 메시지 처리
  - TimescaleDB 시계열 데이터 저장
  - 차트용 time_bucket 집계 쿼리
```

#### 4. Ollama (AI Agent)

```yaml
이미지: ollama/ollama:latest
포트: 11434
모델: phi3:mini (3.8B, Q4 양자화)

용도:
  - 환경 데이터 분석
  - 인사이트 생성
  - 자연어 응답
  - 자동화 제안
```

#### 5. Frontend (Next.js)

```yaml
언어: TypeScript
프레임워크: Next.js 14 (App Router)
포트: 3001

주요 페이지:
  - / : 메인 대시보드
  - /dashboard : 상세 대시보드
  - /sensors : 센서 관리
  - /ai : AI 인터페이스
  - /settings : 설정

기능:
  - 실시간 센서 데이터 표시
  - 차트/그래프 시각화
  - AI 대화 인터페이스
  - IoT 기기 제어
```

#### 6. Nginx (Reverse Proxy)

```yaml
이미지: nginx:alpine
포트: 80, 443

라우팅:
  - / → Frontend (Next.js)
  - /api → Backend (NestJS)
```

---

## 🗂️ 프로젝트 디렉토리 구조

```
smartsense/
│
├─ smart-sense-mcp/                # MCP Client (stdio)
│  ├─ src/
│  │  └─ index.ts                 # MCP stdio 서버
│  ├─ dist/                       # 빌드 결과
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ test-connection.js          # 연결 테스트
│  └─ README.md
│
├─ sensor-node/                    # 라즈베리파이 (Python)
│  ├─ main.py                      # 메인 실행 파일
│  ├─ config.yaml                  # 설정 파일
│  ├─ sensors/                     # 센서 드라이버
│  │  ├─ __init__.py
│  │  ├─ bme680.py                # 온습도 센서
│  │  ├─ scd40.py                 # CO2 센서
│  │  └─ pms5003.py               # 미세먼지 센서
│  ├─ mqtt_client.py              # MQTT 통신
│  ├─ led_controller.py           # LED 제어
│  ├─ requirements.txt            # Python 패키지
│  └─ README.md
│
├─ server/                         # AI Agent 서버
│  │
│  ├─ docker-compose.yml          # Docker 구성
│  ├─ .env                        # 환경 변수
│  │
│  ├─ backend/                    # NestJS API
│  │  ├─ Dockerfile
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  ├─ nest-cli.json
│  │  └─ src/
│  │     ├─ main.ts
│  │     ├─ app.module.ts
│  │     ├─ mqtt/                # MQTT 모듈
│  │     │  ├─ mqtt.module.ts
│  │     │  ├─ mqtt.service.ts
│  │     │  └─ dto/
│  │     ├─ sensors/             # 센서 모듈
│  │     │  ├─ sensors.module.ts
│  │     │  ├─ sensors.controller.ts
│  │     │  ├─ sensors.service.ts
│  │     │  ├─ entities/
│  │     │  └─ dto/
│  │     ├─ ai/                  # AI 모듈
│  │     │  ├─ ai.module.ts
│  │     │  ├─ ai.service.ts
│  │     │  └─ ollama.client.ts
│  │     ├─ agent/               # AI Agent API 모듈
│  │     │  ├─ agent.module.ts
│  │     │  ├─ agent.controller.ts
│  │     │  ├─ agent.service.ts
│  │     │  ├─ dto/
│  │     │  └─ schemas/
│  │     │     └─ tool-schemas.ts  # 9개 Tool 정의
│  │     ├─ mcp/                 # MCP Server 모듈
│  │     │  ├─ mcp.module.ts
│  │     │  ├─ mcp.controller.ts
│  │     │  ├─ mcp-server.service.ts
│  │     │  ├─ dto/
│  │     │  └─ tools/
│  │     │     ├─ sensor-tools.handler.ts
│  │     │     ├─ analysis-tools.handler.ts
│  │     │     └─ device-tools.handler.ts
│  │     ├─ devices/             # IoT 기기 모듈
│  │     │  └─ devices.module.ts
│  │     └─ database/            # DB 모듈
│  │        └─ database.module.ts
│  │
│  ├─ frontend/                   # Next.js Web
│  │  ├─ Dockerfile
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  ├─ next.config.js
│  │  └─ src/
│  │     ├─ app/                 # App Router
│  │     │  ├─ layout.tsx
│  │     │  ├─ page.tsx
│  │     │  ├─ dashboard/
│  │     │  ├─ sensors/
│  │     │  ├─ ai/
│  │     │  └─ settings/
│  │     ├─ components/          # 재사용 컴포넌트
│  │     │  ├─ SensorCard.tsx
│  │     │  ├─ Chart.tsx
│  │     │  └─ Layout.tsx
│  │     ├─ lib/                 # 유틸리티
│  │     │  ├─ api.ts
│  │     │  └─ mqtt.ts
│  │     └─ types/               # TypeScript 타입
│  │        └─ sensor.ts
│  │
│  ├─ config/                     # 설정 파일
│  │  ├─ mosquitto/
│  │  │  └─ mosquitto.conf
│  │  └─ nginx/
│  │     └─ nginx.conf
│  │
│  └─ data/                       # 데이터 볼륨
│     ├─ postgres/               # DB 데이터
│     └─ ollama/                 # AI 모델
│
└─ docs/                          # 문서
   ├─ API.md                     # API 문서
   ├─ DEPLOYMENT.md              # 배포 가이드
   └─ ARCHITECTURE.md            # 아키텍처 상세
```

---

## 📡 통신 프로토콜

### MQTT

#### 토픽 구조 (간소화된 Sparkplug B)

```
spBv1.0/smartsense/

센서 노드:
├─ DBIRTH/ai-server/{node_id}     # 센서 노드 연결
├─ DDATA/ai-server/{node_id}      # 센서 데이터
├─ DDEATH/ai-server/{node_id}     # 센서 노드 연결 해제
└─ DCMD/ai-server/{node_id}       # 센서 노드 제어

AI 서버:
├─ NBIRTH/ai-server                # AI 서버 시작
├─ NDATA/ai-server                 # AI 서버 상태
└─ NDEATH/ai-server                # AI 서버 종료
```

#### 메시지 포맷 (예시)

**DBIRTH (센서 노드 온라인)**
```json
{
  "timestamp": 1705305600000,
  "metrics": [
    {
      "name": "Environment/Temperature",
      "alias": 1,
      "dataType": "Float",
      "properties": {
        "engUnit": {"type": "String", "value": "°C"},
        "engLow": {"type": "Float", "value": -40.0},
        "engHigh": {"type": "Float", "value": 85.0}
      },
      "value": 26.5
    },
    {
      "name": "Environment/Humidity",
      "alias": 2,
      "dataType": "Float",
      "properties": {
        "engUnit": {"type": "String", "value": "%"}
      },
      "value": 45.2
    },
    {
      "name": "AirQuality/CO2",
      "alias": 3,
      "dataType": "Int32",
      "properties": {
        "engUnit": {"type": "String", "value": "ppm"}
      },
      "value": 650
    }
  ],
  "seq": 0
}
```

**DDATA (센서 데이터)**
```json
{
  "timestamp": 1705305660000,
  "metrics": [
    {"alias": 1, "timestamp": 1705305660000, "value": 26.6},
    {"alias": 2, "value": 45.1},
    {"alias": 3, "value": 652}
  ],
  "seq": 1
}
```

### REST API

#### API 문서

서버 실행 후 Swagger UI에서 확인:
```
http://localhost:3000/api/docs
```

#### 주요 엔드포인트

```
센서 관리:
GET    /api/sensors/nodes                    # 센서 노드 목록
GET    /api/sensors/nodes/{nodeId}           # 특정 노드 조회
GET    /api/sensors/nodes/{nodeId}/current   # 현재 센서 값
GET    /api/sensors/nodes/{nodeId}/chart     # 차트용 시계열 데이터
GET    /api/sensors/readings                 # 센서 데이터 조회 (필터링)
GET    /api/sensors/aggregate                # 집계 데이터

AI 기능:
GET    /api/ai/insights                      # AI 인사이트 조회
POST   /api/ai/analyze                       # 환경 분석 요청
POST   /api/ai/chat                          # AI 대화
POST   /api/ai/detect-anomalies/{nodeId}     # 이상 감지

IoT 제어:
GET    /api/devices                          # IoT 기기 목록
GET    /api/devices/{id}                     # 기기 조회
POST   /api/devices/control                  # 기기 제어
GET    /api/devices/{id}/logs                # 제어 로그

AI Agent 통신 (인증 불필요):
GET    /api/agent/info                       # Agent 정보 조회
GET    /api/agent/tools                      # 사용 가능한 Tool 목록
POST   /api/agent/execute                    # Tool 실행
POST   /api/agent/query                      # 자연어 질의
```

---

## 🤖 AI Agent 기능

SmartSense는 단순한 IoT 플랫폼을 넘어 **AI Agent**로 동작하여 다른 AI 시스템과 통신할 수 있습니다.

### Agent 역할

SmartSense Agent는 **센서 데이터 전문 AI Agent**로서:
- 메인 AI에게 센서 정보 제공
- 환경 분석 및 인사이트 생성
- 이상 감지 및 디바이스 제어
- 자연어로 센서 데이터 설명

### Agent API (REST 기반)

다른 AI Agent가 HTTP로 SmartSense와 통신할 수 있습니다.

```bash
# Agent 정보 조회
curl http://localhost:3000/api/agent/info

# 사용 가능한 Tool 목록
curl http://localhost:3000/api/agent/tools

# 센서 데이터 조회
curl -X POST http://localhost:3000/api/agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_current_sensor_data",
    "parameters": { "nodeId": "NODE001" }
  }'
```

### MCP (Model Context Protocol)

Claude, GPT 등의 AI가 표준 MCP 프로토콜로 SmartSense와 통신할 수 있습니다.

#### MCP Client 설치

```bash
# 1. MCP Client 빌드
cd smart-sense-mcp
npm install
npm run build

# 2. Backend 연결 테스트
node test-connection.js
```

#### Claude Desktop 설정

`claude_desktop_config.json` 파일에 다음 설정 추가:

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

설정 후 Claude Desktop을 재시작하세요.

### 제공하는 9가지 Tool

#### 센서 데이터 Tool (4개)
1. `get_sensor_nodes` - 모든 센서 노드 목록
2. `get_current_sensor_data` - 현재 센서 값 조회
3. `get_sensor_history` - 과거 데이터 조회
4. `get_sensor_statistics` - 통계 분석

#### AI 분석 Tool (3개)
5. `analyze_environment` - 환경 분석
6. `detect_anomalies` - 이상 감지
7. `get_ai_insights` - AI 인사이트 조회

#### 디바이스 제어 Tool (2개)
8. `control_device` - IoT 디바이스 제어
9. `get_device_status` - 디바이스 상태 조회

### 통신 구조

```
메인 AI Agent (Claude, GPT 등)
    │
    │ HTTP POST /api/agent/execute
    │ 또는
    │ MCP Protocol
    ↓
SmartSense Agent
    │
    ├─→ 센서 데이터 조회 (DB)
    ├─→ AI 분석 실행 (Ollama)
    ├─→ 디바이스 제어 (MQTT)
    │
    ↓
응답 반환 (JSON)
```

**특징**:
- ✅ **인증 불필요**: Agent 엔드포인트는 Public
- ✅ **표준 프로토콜**: REST API + MCP 지원
- ✅ **일방향 통신**: 메인 AI가 SmartSense를 호출
- ✅ **9개 Tool**: 센서, 분석, 제어 기능 제공

---

## 🗄️ 데이터베이스 설계

### 데이터베이스 스키마

**ORM**: Prisma
**스키마 파일**: `server/backend/prisma/schema.prisma`

#### 주요 테이블

```sql
-- 센서 노드
CREATE TABLE sensor_nodes (
    id SERIAL PRIMARY KEY,
    node_id TEXT UNIQUE NOT NULL,
    name TEXT,
    location TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 센서 데이터 (TimescaleDB Hypertable)
CREATE TABLE sensor_readings (
    node_id INTEGER NOT NULL,
    sensor_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (timestamp, node_id, metric_name)
);

-- TimescaleDB hypertable 생성
SELECT create_hypertable('sensor_readings', 'timestamp',
    migrate_data => TRUE, if_not_exists => TRUE);

-- AI 인사이트
CREATE TABLE ai_insights (
    id SERIAL PRIMARY KEY,
    node_id INTEGER NOT NULL,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IoT 기기 제어 로그
CREATE TABLE device_control_logs (
    id SERIAL PRIMARY KEY,
    node_id INTEGER,
    device_id TEXT NOT NULL,
    device_type TEXT NOT NULL,
    action TEXT NOT NULL,
    parameters JSONB,
    triggered_by TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**스키마 관리**:
```bash
# 마이그레이션 생성
npx prisma migrate dev --name <migration_name>

# Prisma Client 생성
npx prisma generate

# Prisma Studio (GUI)
npx prisma studio
```

---

## 🚀 배포 및 실행

### AI Agent 서버 배포

```bash
# 1. 저장소 클론
git clone <repository-url>
cd smartsense/server

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (DB 비밀번호 등)

# 3. Docker Compose 실행
docker-compose up -d

# 4. Ollama 모델 다운로드
docker exec -it smartsense-ai ollama pull phi3:mini

# 5. 웹 접속
# http://server-ip
```

### 센서 노드 배포

```bash
# 1. 라즈베리파이에 코드 복사
cd smartsense/sensor-node

# 2. 패키지 설치
pip install -r requirements.txt

# 3. 설정 파일 수정
nano config.yaml
# MQTT 브로커 주소, 노드 ID 등 설정

# 4. 실행
python main.py

# 5. 서비스 등록 (자동 시작)
sudo cp smartsense-sensor.service /etc/systemd/system/
sudo systemctl enable smartsense-sensor
sudo systemctl start smartsense-sensor
```

---

## 🔗 스마트홈 시스템 연동

### Home Assistant 연동

**MQTT Discovery**
- 자동 기기 등록
- 센서 값 실시간 업데이트
- 자동화 룰 생성 가능

```yaml
# configuration.yaml
mqtt:
  broker: smartsense-server-ip
  port: 1883
  discovery: true
  discovery_prefix: homeassistant
```

### Node-RED 연동

**MQTT 플로우**
- MQTT In 노드로 센서 데이터 구독
- Function 노드로 데이터 가공
- Dashboard UI 생성

### Alexa / Google Home 연동

**REST API 활용**
- 음성 명령으로 현재 환경 조회
- "알렉사, 거실 온도는?"
- "오케이 구글, 공기청정기 켜줘"

### Grafana 대시보드

**시각화 구성**
```yaml
Data Source:
  - PostgreSQL/TimescaleDB 연결
  - 센서 데이터 쿼리
  - 실시간 그래프 생성
```

---

## 📊 데이터 플로우

```
센서 측정
    ↓
센서 노드 (Python)
    ↓ MQTT Publish
    │ Topic: spBv1.0/smartsense/DDATA/ai-server/{node_id}
    ↓
Mosquitto Broker
    ↓
    ├────────────────┬──────────────────┐
    ↓                ↓                  ↓
Backend (NestJS)   Frontend         외부 시스템
MQTT Subscribe    WebSocket         MQTT Bridge
    ↓
TimescaleDB 저장
    ↓
데이터 분석
    ├─ REST API로 조회
    ├─ AI 분석 (Ollama)
    └─ 자동화 룰 실행
    ↓
사용자 인터페이스
    ├─ 웹 대시보드 (Next.js)
    ├─ AI 대화 인터페이스
    └─ IoT 기기 제어
```

---

## 💰 비용 정리

### 프로토타입 (MVP)

| 항목 | 수량 | 단가 | 합계 |
|------|------|------|------|
| **센서 노드** | 1개 | | |
| 라즈베리파이 세트 | 1 | $90 | $90 |
| BME680 센서 | 1 | $18 | $18 |
| LED, 부저, 기타 | 1 | $10 | $10 |
| **AI Agent 서버** | | | |
| Intel NUC (중고) | 1 | $400 | $400 |
| RAM 추가 (옵션) | 1 | $50 | $50 |
| SSD 추가 (옵션) | 1 | $80 | $80 |
| **합계** | | | **~$650** |

### 제품 (표준)

| 항목 | 수량 | 단가 | 합계 |
|------|------|------|------|
| **센서 노드** | 3개 | $155 | $465 |
| (온습도 + CO2) | | | |
| **AI Agent 서버** | 1개 | $630 | $630 |
| **합계** | | | **~$1,100** |

---

## 🎯 개발 로드맵

### Phase 1: 기본 기능 (4-6주)

**목표: 센서 데이터 수집 및 표시**

- [ ] 라즈베리파이 센서 드라이버 개발
- [ ] MQTT 통신 구현
- [ ] AI 서버 Docker 환경 구축
- [ ] Backend API 기본 구조
- [ ] TimescaleDB 스키마 설계
- [ ] Frontend 기본 대시보드
- [ ] 실시간 데이터 표시

### Phase 2: AI 통합 (6-8주)

**목표: AI 기반 분석 및 인사이트**

- [ ] Ollama 통합
- [ ] AI 분석 모듈 개발
- [ ] 패턴 학습 알고리즘
- [ ] 이상 감지 기능
- [ ] 예측 모델
- [ ] AI 대화 인터페이스
- [ ] 자동화 룰 엔진

### Phase 3: IoT 제어 (3-4주)

**목표: 자동화 및 기기 제어**

- [ ] IoT 기기 연동
- [ ] 자동화 룰 실행
- [ ] 기기 제어 API
- [ ] 스케줄링 시스템
- [ ] 알림 시스템

### Phase 4: 확장 및 최적화 (2-3주)

**목표: 외부 연동 및 성능 개선**

- [ ] SCADA 연동 테스트
- [ ] REST API 문서화
- [ ] 성능 최적화
- [ ] 보안 강화
- [ ] 배포 자동화

---

## 🔒 보안 고려사항

### MQTT 보안

```yaml
인증:
  - Username/Password
  - TLS/SSL 암호화 (Port 8883)

접근 제어:
  - ACL (Access Control List)
  - Topic별 권한 관리
```

### API 보안

```yaml
인증/인가:
  - Firebase Authentication (JWT)
  - 모든 API 엔드포인트 보호
  - Google Sign-In 지원
  - 토큰 기반 세션 관리

통신 암호화:
  - HTTPS (TLS 1.3)

Rate Limiting:
  - API 호출 제한
```

### 네트워크 보안

```yaml
홈 네트워크 구성:
  - 센서 노드: WiFi 또는 유선 LAN
  - AI 서버: 유선 LAN 권장
  - 외부 접근: VPN 또는 CloudFlare Tunnel

방화벽:
  - 필요한 포트만 개방
  - 로컬 네트워크 내에서만 접근 허용
```

---

## 📚 참고 자료

### 프로토콜 & 표준

- MQTT Sparkplug B: https://sparkplug.eclipse.org/
- MQTT: https://mqtt.org/
- TimescaleDB: https://docs.timescale.com/

### 프레임워크 & 라이브러리

- NestJS: https://nestjs.com/
- Next.js: https://nextjs.org/
- Ollama: https://ollama.ai/

### 하드웨어

- Raspberry Pi: https://www.raspberrypi.org/
- BME680: https://www.bosch-sensortec.com/
- SCD40: https://sensirion.com/

---

## 📞 연락처 및 지원

프로젝트 관련 문의나 기술 지원이 필요한 경우 아래로 연락 주세요.

- 프로젝트 저장소: [GitHub Repository URL]
- 문서: [Documentation URL]
- 이슈 트래커: [Issue Tracker URL]

---

## 📝 라이선스

이 프로젝트는 [라이선스 타입]에 따라 배포됩니다.

---

**문서 버전**: 1.2
**최종 수정일**: 2025-10-28
**주요 업데이트**:
- **AI Agent 기능 추가**: Agent API + MCP Server 구현
- **9개 Tool 제공**: 센서, AI 분석, 디바이스 제어
- **MCP (Model Context Protocol) 지원**: Claude, GPT 등과 통신 가능
- Prisma ORM 적용
- Swagger API 문서화
- TimescaleDB time_bucket 차트 API 추가
