# SmartSense Plug and Play 설정 가이드

센서 노드의 자동 WiFi 설정 및 서버 검색 기능

## 개요

SmartSense 센서 노드는 Plug and Play 방식으로 동작합니다. 복잡한 설정 없이 센서 노드를 켜고 스마트폰으로 WiFi 정보만 입력하면 자동으로 서버를 찾아 연결됩니다.

## 동작 방식

```
1. 센서 노드 전원 켜기
   ↓
2. 이더넷 연결 확인
   ├─ 이더넷 연결됨 → 7번으로
   └─ 이더넷 없음 → 3번으로
   ↓
3. WiFi 연결 확인
   ├─ WiFi 연결됨 → 7번으로
   └─ WiFi 없음 → 4번으로
   ↓
4. AP 모드 활성화 (SSID: SmartSense-XXXX)
   ↓
5. 스마트폰/PC로 AP 접속
   ↓
6. 웹 페이지에서 WiFi 정보 입력 및 연결
   ↓
7. mDNS로 서버 자동 검색
   ↓
8. MQTT 연결 및 데이터 전송 시작
```

## 상세 설정 과정

### 1. 센서 노드 준비

#### 하드웨어 연결
- 라즈베리파이에 센서 연결
- 전원 연결

#### 소프트웨어 설치
```bash
cd smartsense/sensor-node
pip install -r requirements.txt
```

### 2. 센서 노드 실행

```bash
# 센서 노드 실행 (Plug and Play 기본 탑재)
python main.py
```

#### 초기 부팅 로그 (이더넷 미연결 시)
```
SmartSense Sensor Node (Plug and Play)
============================================================
Checking network connection...
No network connection found
No saved WiFi configuration
Starting provisioning mode...
AP SSID: SmartSense-A1B2
AP Password: smartsense
Web server: http://192.168.4.1
Waiting for WiFi configuration...
```

#### 초기 부팅 로그 (이더넷 연결 시)
```
SmartSense Sensor Node (Plug and Play)
============================================================
Checking network connection...
✓ Ethernet connected: 192.168.1.50
Discovering SmartSense server...
Server found: 192.168.1.100
MQTT connected successfully
Setup complete!
```

### 3. WiFi 설정 (스마트폰)

#### 3-1. AP 접속
1. 스마트폰 WiFi 설정 열기
2. `SmartSense-XXXX` 네트워크 찾기
3. 비밀번호 입력: `smartsense`
4. 연결

#### 3-2. 설정 페이지 접속
1. 브라우저 열기
2. 주소창에 입력: `http://192.168.4.1`
3. 설정 페이지 자동 표시

#### 3-3. WiFi 정보 입력
1. **WiFi Network**: 집/사무실 WiFi SSID 입력
2. **Password**: WiFi 비밀번호 입력
3. **Connect** 버튼 클릭

#### 3-4. 연결 대기
- "Connecting to WiFi..." 메시지 표시
- 성공 시: "Connected successfully!" 표시
- 실패 시: 오류 메시지 표시, 다시 시도

### 4. 자동 서버 검색

WiFi 연결 후 자동으로 진행됩니다.

```
WiFi connected: 192.168.1.xxx
Discovering SmartSense server...
Server found: 192.168.1.100
MQTT connected successfully
Setup complete!
```

### 5. 정상 동작 확인

#### LED 상태
- **파란색 깜빡임**: 설정 모드 (AP 모드)
- **노란색 깜빡임**: WiFi 연결 중
- **보라색 깜빡임**: 서버 검색 중
- **녹색 깜빡임**: 데이터 전송 중
- **녹색 점등**: 정상 동작

#### 부저 소리
- **2회 짧은 소리**: WiFi 연결 완료
- **3회 짧은 소리**: 서버 검색 완료
- **연속 짧은 소리**: 치명적 오류

## 문제 해결

### WiFi 연결 실패

**증상**: "Connection failed" 메시지

**원인**:
- 잘못된 WiFi 비밀번호
- WiFi 신호 약함
- WiFi 네트워크 문제

**해결 방법**:
1. WiFi 비밀번호 재확인
2. 라즈베리파이를 공유기에 가까이 이동
3. 다시 설정 시도

### 서버 검색 실패

**증상**: "SmartSense server not found"

**원인**:
- 서버가 실행되지 않음
- 센서 노드와 서버가 다른 네트워크
- mDNS가 방화벽에 막힘

**해결 방법**:

1. 서버 실행 확인
```bash
# 서버 실행
cd smartsense/server
docker-compose up -d

# 로그 확인
docker-compose logs backend
```

2. 같은 네트워크 확인
- 센서 노드와 서버가 같은 네트워크에 연결되어 있는지 확인 (WiFi 또는 이더넷)
- 서버 IP 주소 확인: `docker exec smartsense-backend ip addr`

3. 방화벽 설정
```bash
# mDNS 포트 개방 (UDP 5353)
sudo ufw allow 5353/udp
```

4. 수동 설정 (임시 해결)
```yaml
# config.yaml 수정
mqtt:
  broker_host: "192.168.1.100"  # 서버 IP 직접 입력
  broker_port: 1883
```

### AP 모드가 시작되지 않음

**증상**: AP 모드로 전환되지 않음

**원인**:
- 권한 부족
- WiFi 어댑터 문제

**해결 방법**:
```bash
# 필요한 패키지 설치
sudo apt-get install hostapd dnsmasq

# 서비스 중지
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq

# 서비스 비활성화 (자동 시작 방지)
sudo systemctl disable hostapd
sudo systemctl disable dnsmasq

# 권한으로 실행
sudo python main.py
```

## 수동 설정 방법

자동 설정이 작동하지 않는 경우 수동으로 설정할 수 있습니다.

### 1. WiFi 설정 파일 생성

```json
// wifi_config.json
{
  "ssid": "YourWiFiName",
  "password": "YourWiFiPassword",
  "timestamp": 1705305600.0
}
```

### 2. MQTT 설정 파일 수정

```yaml
# config.yaml
mqtt:
  broker_host: "192.168.1.100"  # 서버 IP
  broker_port: 1883
```

### 3. 센서 노드 실행

```bash
python main.py
```

## 설정 초기화

센서 노드를 다른 WiFi 네트워크에 연결하려면:

```bash
# WiFi 설정 파일 삭제
rm wifi_config.json

# 센서 노드 재시작
python main.py
```

AP 모드가 다시 활성화되고 새로운 WiFi를 설정할 수 있습니다.

## 기술 세부사항

### mDNS 서비스

**서비스 타입**: `_smartsense._tcp.local.`

**서비스 속성**:
- `mqtt_port`: MQTT 브로커 포트 (1883)
- `api_port`: REST API 포트 (3000)
- `version`: 소프트웨어 버전

### WiFi Provisioning

**AP 설정**:
- SSID 형식: `SmartSense-XXXX` (XXXX는 MAC 주소 뒷자리)
- 비밀번호: `smartsense`
- IP 주소: `192.168.4.1`
- DHCP 범위: `192.168.4.2-20`

**웹 서버**:
- 포트: 80
- 프로토콜: HTTP
- 인터페이스: HTML + JavaScript

### 보안 고려사항

**AP 모드**:
- WPA2 암호화
- 기본 비밀번호 사용 (변경 권장 안함, 임시 사용)
- WiFi 설정 후 자동으로 AP 모드 종료

**WiFi 인증 정보**:
- 로컬 파일에 평문 저장 (`wifi_config.json`)
- 파일 권한: 600 (소유자만 읽기/쓰기)
- 주의: 프로덕션 환경에서는 암호화 권장

## FAQ

**Q: 여러 센서 노드를 설정하려면?**

A: 각 센서 노드를 개별적으로 설정합니다. 모두 같은 WiFi 네트워크에 연결하면 자동으로 서버를 찾아 연결됩니다.

**Q: 서버 IP가 변경되면?**

A: mDNS를 사용하므로 서버 IP가 변경되어도 자동으로 새 주소를 찾습니다. 재설정 불필요.

**Q: 여러 서버가 네트워크에 있으면?**

A: 첫 번째로 발견된 SmartSense 서버에 연결됩니다. 특정 서버를 선택하려면 수동 설정 필요.

**Q: 모바일 핫스팟에 연결 가능한가요?**

A: 가능합니다. 핫스팟과 서버가 같은 네트워크에 있어야 합니다.

**Q: 이더넷과 WiFi를 동시에 사용할 수 있나요?**

A: 센서 노드는 이더넷을 우선적으로 사용합니다. 이더넷이 연결되어 있으면 WiFi 설정을 건너뜁니다.

**Q: WiFi 설정을 변경하려면?**

A: `wifi_config.json` 파일을 삭제하고 센서 노드를 재시작하면 다시 AP 모드로 진입합니다.

## 참고 자료

- [mDNS (Multicast DNS)](https://en.wikipedia.org/wiki/Multicast_DNS)
- [Zeroconf Python Library](https://github.com/jstasiak/python-zeroconf)
- [Raspberry Pi Access Point](https://www.raspberrypi.org/documentation/configuration/wireless/access-point.md)
