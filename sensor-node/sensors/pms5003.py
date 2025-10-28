"""
PMS5003 Sensor Driver - Particulate Matter
"""

from typing import Dict, Any
import serial
import time
from .base_sensor import BaseSensor


class PMS5003Sensor(BaseSensor):
    """
    PMS5003 particulate matter sensor
    Measures: PM1.0, PM2.5, PM10 (μg/m³)
    """

    def __init__(self, config: Dict[str, Any]):
        super().__init__("PMS5003", config)
        self.serial_port = config.get('uart_port', '/dev/ttyAMA0')
        self.baudrate = config.get('baudrate', 9600)
        self.ser = None

    def initialize(self) -> bool:
        """Initialize PMS5003 sensor"""
        # If using dummy data, skip hardware initialization
        if self.use_dummy:
            self._initialized = True
            self.logger.info("PMS5003 initialized in DUMMY mode (no hardware required)")
            return True

        try:
            # Open serial connection
            self.ser = serial.Serial(
                self.serial_port,
                baudrate=self.baudrate,
                timeout=2.0
            )

            # Wait for sensor to stabilize
            time.sleep(1)

            # Clear buffer
            self.ser.reset_input_buffer()

            self._initialized = True
            self.logger.info(f"PMS5003 initialized on {self.serial_port}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to initialize PMS5003: {e}")
            return False

    def read(self) -> Dict[str, Any]:
        """
        Read PMS5003 sensor data

        Returns:
            Dictionary with PM1.0, PM2.5, PM10 values
        """
        if not self._initialized or not self.ser:
            raise RuntimeError("PMS5003 sensor not initialized")

        try:
            # Read data frame
            data = self._read_frame()

            if data:
                result = {
                    'pm1_0': data['pm1_0_atm'],
                    'pm2_5': data['pm2_5_atm'],
                    'pm10': data['pm10_atm'],
                    'pm2_5_aqi': self._calculate_aqi(data['pm2_5_atm'])
                }
                return result
            else:
                raise RuntimeError("Failed to read valid data from PMS5003")

        except Exception as e:
            self.logger.error(f"Failed to read PMS5003: {e}")
            raise

    def _read_frame(self) -> Dict[str, Any]:
        """
        Read and parse PMS5003 data frame

        Returns:
            Parsed data dictionary or None if invalid
        """
        max_attempts = 5

        for _ in range(max_attempts):
            # Look for start bytes (0x42, 0x4d)
            byte = self.ser.read(1)
            if byte == b'\x42':
                byte = self.ser.read(1)
                if byte == b'\x4d':
                    # Read remaining frame (30 bytes)
                    frame = self.ser.read(30)

                    if len(frame) == 30:
                        # Parse frame
                        data = self._parse_frame(frame)
                        if data:
                            return data

        return None

    def _parse_frame(self, frame: bytes) -> Dict[str, Any]:
        """
        Parse PMS5003 data frame

        Args:
            frame: 30-byte data frame

        Returns:
            Parsed data dictionary or None if checksum fails
        """
        # Calculate checksum
        checksum = 0x42 + 0x4d
        for byte in frame[:-2]:
            checksum += byte

        frame_checksum = (frame[-2] << 8) | frame[-1]

        if checksum != frame_checksum:
            self.logger.warning("PMS5003 checksum mismatch")
            return None

        # Extract values (big-endian)
        data = {
            'pm1_0_cf1': (frame[2] << 8) | frame[3],
            'pm2_5_cf1': (frame[4] << 8) | frame[5],
            'pm10_cf1': (frame[6] << 8) | frame[7],
            'pm1_0_atm': (frame[8] << 8) | frame[9],
            'pm2_5_atm': (frame[10] << 8) | frame[11],
            'pm10_atm': (frame[12] << 8) | frame[13],
        }

        return data

    def _calculate_aqi(self, pm2_5: float) -> int:
        """
        Calculate Air Quality Index from PM2.5
        Using US EPA AQI standard

        Args:
            pm2_5: PM2.5 concentration (μg/m³)

        Returns:
            AQI value
        """
        if pm2_5 < 0:
            return 0

        # AQI breakpoints for PM2.5
        breakpoints = [
            (0.0, 12.0, 0, 50),
            (12.1, 35.4, 51, 100),
            (35.5, 55.4, 101, 150),
            (55.5, 150.4, 151, 200),
            (150.5, 250.4, 201, 300),
            (250.5, 500.4, 301, 500),
        ]

        for c_low, c_high, i_low, i_high in breakpoints:
            if c_low <= pm2_5 <= c_high:
                aqi = ((i_high - i_low) / (c_high - c_low)) * (pm2_5 - c_low) + i_low
                return int(aqi)

        # Above 500
        return 500

    def read_dummy(self) -> Dict[str, Any]:
        """
        Generate dummy PMS5003 data for testing

        Returns:
            Dictionary with simulated sensor values
        """
        pm2_5_value = self._random_value(15.0, 8.0)  # 7-23 μg/m³
        return {
            'pm1_0': int(self._random_value(10.0, 5.0)),   # 5-15 μg/m³
            'pm2_5': int(pm2_5_value),
            'pm10': int(self._random_value(25.0, 10.0)),   # 15-35 μg/m³
            'pm2_5_aqi': self._calculate_aqi(pm2_5_value)
        }

    def _get_unit(self, metric_name: str) -> str:
        """Get unit for PMS5003 metrics"""
        units = {
            'pm1_0': 'μg/m³',
            'pm2_5': 'μg/m³',
            'pm10': 'μg/m³',
            'pm2_5_aqi': 'AQI'
        }
        return units.get(metric_name, '')

    def close(self):
        """Clean up PMS5003 sensor"""
        if self.ser and self.ser.is_open:
            self.ser.close()

        self.ser = None
        self._initialized = False
        self.logger.info("PMS5003 sensor closed")
