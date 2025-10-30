# SmartSense Sensor Node - MQTT Protocol

## MQTT 토픽 구조

```
smartsense/
└── {node_id}/                    # 예: sensor-node-01
    ├── status                    # 노드 상태 (online/offline)
    │   └── [PUBLISH, Retained, QoS 1]
    ├── sensors                   # 센서 데이터
    │   └── [PUBLISH, QoS 0]
    └── command                   # 명령 수신
        └── [SUBSCRIBE, QoS 1]
```

### 토픽 설명

| 토픽 | 방향 | QoS | Retained | 설명 |
|------|------|-----|----------|------|
| `smartsense/{node_id}/status` | Publish | 1 | Yes | 노드 상태 (online/offline) |
| `smartsense/{node_id}/sensors` | Publish | 0 | No | 센서 데이터 |
| `smartsense/{node_id}/command` | Subscribe | 1 | No | 명령 수신 (미구현) |

**QoS 레벨**:
- QoS 0: At most once (최선 전달) - 센서 데이터
- QoS 1: At least once (최소 1회 전달 보장) - 상태 메시지

**Retained 플래그**:
- True: 마지막 메시지 유지 (새 구독자가 즉시 받음) - 상태 메시지
- False: 메시지 유지 안 함 - 센서 데이터

---

## 메시지 포맷

### 1. Status 메시지

**토픽**: `smartsense/{node_id}/status`
**QoS**: 1 (최소 1회 전달 보장)
**Retain**: true (마지막 상태 유지)

#### 메시지 구조

```json
{
  "node_id": "sensor-node-01",
  "status": "online",              // "online" | "offline"
  "location": "Office Room A",
  "description": "Temperature and air quality monitoring",
  "timestamp": 1761653652992       // Unix timestamp (ms)
}
```

#### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `node_id` | string | Yes | 노드 고유 ID |
| `status` | string | Yes | 노드 상태: "online" 또는 "offline" |
| `location` | string | No | 노드 설치 위치 |
| `description` | string | No | 노드 설명 |
| `timestamp` | number | Yes | Unix timestamp (밀리초) |

#### 전송 시점

1. **MQTT 연결 성공 시**: `status: "online"` 발행
2. **정상 종료 시**: `status: "offline"` 발행
3. **비정상 종료 시**: Last Will and Testament (LWT)로 자동 발행

#### 예제

**온라인 상태**:
```json
{
  "node_id": "sensor-node-01",
  "status": "online",
  "location": "Office Room A",
  "description": "Temperature and air quality monitoring",
  "timestamp": 1761653652992
}
```

**오프라인 상태**:
```json
{
  "node_id": "sensor-node-01",
  "status": "offline",
  "timestamp": 1761653999999
}
```

---

### 2. Sensors 메시지

**토픽**: `smartsense/{node_id}/sensors`
**QoS**: 0 (최선 전달)
**Retain**: false

#### 메시지 구조

```json
{
  "node_id": "sensor-node-01",
  "timestamp": 1761794295181,
  "sensors": {
    "{sensor_name}/{metric_name}": {
      "value": 25.11,
      "unit": "°C",
      "timestamp": 1761794865340
    }
  }
}
```

#### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `node_id` | string | Yes | 노드 고유 ID |
| `timestamp` | number | Yes | 메시지 생성 시각 (Unix timestamp, ms) |
| `sensors` | object | Yes | 센서 데이터 객체 |
| `sensors.{key}` | object | Yes | 센서별 측정값 (키: "센서명/메트릭명") |
| `sensors.{key}.value` | number | Yes | 측정값 |
| `sensors.{key}.unit` | string | Yes | 단위 |
| `sensors.{key}.timestamp` | number | Yes | 측정 시각 (Unix timestamp, ms) |

#### 전송 주기

- **주기**: `config.yaml`의 `read_interval` 설정값 (기본 15초)
- **조건**: 최소 1개 이상의 센서 데이터가 있을 때

#### 센서별 메트릭

##### BME680 (온도, 습도, 압력, VOC)

```json
{
  "node_id": "sensor-node-01",
  "timestamp": 1761794295181,
  "sensors": {
    "BME680/temperature": {
      "value": 25.11,
      "unit": "°C",
      "timestamp": 1761794865340
    },
    "BME680/humidity": {
      "value": 45.2,
      "unit": "%",
      "timestamp": 1761794865340
    },
    "BME680/pressure": {
      "value": 1013.25,
      "unit": "hPa",
      "timestamp": 1761794865340
    },
    "BME680/gas_resistance": {
      "value": 125000,
      "unit": "Ω",
      "timestamp": 1761794865340
    }
  }
}
```

##### SCD40 (CO2, 온도, 습도)

```json
{
  "sensors": {
    "SCD40/co2": {
      "value": 850,
      "unit": "ppm",
      "timestamp": 1761794865340
    },
    "SCD40/temperature": {
      "value": 24.8,
      "unit": "°C",
      "timestamp": 1761794865340
    },
    "SCD40/humidity": {
      "value": 48.5,
      "unit": "%",
      "timestamp": 1761794865340
    }
  }
}
```

##### PMS5003 (미세먼지)

```json
{
  "sensors": {
    "PMS5003/pm1_0": {
      "value": 5,
      "unit": "µg/m³",
      "timestamp": 1761794865340
    },
    "PMS5003/pm2_5": {
      "value": 12,
      "unit": "µg/m³",
      "timestamp": 1761794865340
    },
    "PMS5003/pm10": {
      "value": 18,
      "unit": "µg/m³",
      "timestamp": 1761794865340
    }
  }
}
```

##### BH1750 (조도)

```json
{
  "sensors": {
    "BH1750/illuminance": {
      "value": 450.5,
      "unit": "lx",
      "timestamp": 1761794865340
    }
  }
}
```

---

### 3. Command 메시지 (미구현)

**토픽**: `smartsense/{node_id}/command`
**QoS**: 1
**Retain**: false

현재 구독만 하고 있으며, 실제 명령 처리는 미구현 상태입니다.

#### 계획된 메시지 구조

```json
{
  "command": "set_interval",
  "parameters": {
    "read_interval": 30
  },
  "timestamp": 1761794865340
}
```

---

## MQTT 설정

### config.yaml 설정

```yaml
mqtt:
  broker_host: "192.168.0.10"  # MQTT 브로커 주소
  broker_port: 1883             # MQTT 브로커 포트
  username: ""                  # 인증 사용자명 (선택)
  password: ""                  # 인증 비밀번호 (선택)
  use_tls: false                # TLS 사용 여부
```

### 연결 설정

- **Client ID**: `smartsense-{node_id}` (예: `smartsense-sensor-node-01`)
- **Clean Session**: false (세션 유지)
- **Keep Alive**: 60초
- **LWT (Last Will and Testament)**:
  - Topic: `smartsense/{node_id}/status`
  - Payload: `{"node_id": "{node_id}", "status": "offline", "timestamp": ...}`
  - QoS: 1
  - Retained: true

---

## Backend에서 데이터 수신

### MQTT 구독

Backend는 다음 토픽을 구독해야 합니다:

```
smartsense/+/status    # 모든 노드의 상태
smartsense/+/sensors   # 모든 노드의 센서 데이터
```

**Wildcard 사용**:
- `+`: 단일 레벨 와일드카드 (예: `smartsense/+/status`는 `smartsense/sensor-node-01/status`, `smartsense/sensor-node-02/status` 등을 모두 구독)

### 데이터 처리 예제

```typescript
// NestJS MQTT 구독 예제
@Subscribe('smartsense/+/sensors')
handleSensorData(@Payload() data: SensorData, @Ctx() context: MqttContext) {
  const topic = context.getTopic(); // "smartsense/sensor-node-01/sensors"
  const nodeId = data.node_id;

  // 센서 데이터를 TimescaleDB에 저장
  for (const [metricName, metricData] of Object.entries(data.sensors)) {
    await this.sensorService.saveSensorReading({
      nodeId: nodeId,
      metricName: metricName,
      value: metricData.value,
      unit: metricData.unit,
      timestamp: new Date(metricData.timestamp)
    });
  }
}

@Subscribe('smartsense/+/status')
handleNodeStatus(@Payload() data: NodeStatus) {
  // 노드 상태 업데이트
  await this.nodeService.updateNodeStatus({
    nodeId: data.node_id,
    status: data.status,
    lastSeen: new Date(data.timestamp)
  });
}
```

---

## 트러블슈팅

### 연결 실패

**증상**: MQTT 브로커 연결 실패
**확인사항**:
1. 브로커 주소가 올바른지 확인 (`config.yaml`의 `broker_host`)
2. 브로커가 실행 중인지 확인
3. 방화벽에서 1883 포트가 열려 있는지 확인
4. 인증이 필요한 경우 `username`과 `password` 설정 확인

### 데이터 미수신

**증상**: 센서 데이터가 Backend에 수신되지 않음
**확인사항**:
1. Sensor Node가 정상 실행 중인지 확인
2. MQTT Explorer 등으로 데이터 발행 확인
3. Backend의 MQTT 구독 토픽 확인 (`smartsense/+/sensors`)
4. QoS 레벨 확인 (센서 데이터는 QoS 0이므로 네트워크 불안정 시 손실 가능)

### Retained 메시지 삭제

불필요한 retained 메시지 삭제:

```bash
# mosquitto_pub 사용
mosquitto_pub -h localhost -t "smartsense/sensor-node-01/status" -n -r

# -n: null payload (빈 메시지)
# -r: retained flag
```
