# SmartSense Sensor Node

IoT 센서 노드 - 환경 데이터 수집 및 MQTT 전송

## 📚 문서

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 시스템 아키텍처 및 흐름도
- **[MQTT_PROTOCOL.md](./MQTT_PROTOCOL.md)** - MQTT 통신 프로토콜 상세
- **[PLUG_AND_PLAY.md](../docs/PLUG_AND_PLAY.md)** - WiFi 프로비저닝 및 자동 서버 탐색

## 개요

SmartSense Sensor Node는 라즈베리 파이에서 실행되는 센서 데이터 수집 프로그램입니다.
다양한 환경 센서로부터 데이터를 읽어 MQTT를 통해 SmartSense 백엔드로 전송합니다.

**주요 기능**:
- 🌡️ 다중 센서 지원 (온도, 습도, CO2, 미세먼지 등)
- 📡 MQTT 기반 실시간 데이터 전송
- 🔌 Plug and Play (WiFi 자동 프로비저닝)
- 💡 LED/Buzzer를 통한 상태 표시
- 🔄 자동 재연결 및 에러 복구

## 빠른 시작

### 실행

```bash
python main.py
```

## 설치 방법

### Windows/Mac 개발 환경

센서 하드웨어 없이 개발하려면:

```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 개발용 패키지 설치
pip install -r requirements-dev.txt
```

설정 파일에서 더미 데이터 활성화:
```yaml
# config.yaml
sensors:
  bme680:
    enabled: true
    use_dummy: true  # 더미 데이터 사용
```

### Raspberry Pi 배포 환경

실제 센서와 함께 사용:

```bash
# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate

# 전체 패키지 설치 (센서 라이브러리 포함)
pip install -r requirements.txt
```

설정 파일에서 실제 센서 활성화:
```yaml
# config.yaml
sensors:
  bme680:
    enabled: true
    use_dummy: false  # 실제 센서 사용
```

## 실행

```bash
python main.py
```

## 더미 데이터 모드

센서 하드웨어가 없어도 시뮬레이션 데이터로 테스트 가능:

- `use_dummy: true`: 임의의 현실적인 센서 값 생성
- `use_dummy: false`: 실제 센서에서 데이터 읽기

각 센서별로 개별 설정 가능합니다.

## 지원 센서

- **BME680**: 온도, 습도, 압력, VOC
- **SCD40**: CO2 농도
- **PMS5003**: 미세먼지 (PM1.0, PM2.5, PM10)
- **BH1750**: 조도

## Plug and Play

자세한 WiFi 설정 및 자동 서버 검색 기능은 [PLUG_AND_PLAY.md](../docs/PLUG_AND_PLAY.md)를 참고하세요.
