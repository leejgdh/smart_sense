"""
SCD40 Sensor Driver - CO2, Temperature, Humidity
"""

from typing import Dict, Any
import time
from .base_sensor import BaseSensor

try:
    import board
    import adafruit_scd4x
    SCD40_AVAILABLE = True
except ImportError:
    SCD40_AVAILABLE = False


class SCD40Sensor(BaseSensor):
    """
    SCD40 CO2 sensor
    Measures: CO2 (ppm), Temperature, Humidity
    """

    def __init__(self, config: Dict[str, Any]):
        super().__init__("SCD40", config)
        self.sensor = None

    def initialize(self) -> bool:
        """Initialize SCD40 sensor"""
        # If using dummy data, skip hardware initialization
        if self.use_dummy:
            self._initialized = True
            self.logger.info("SCD40 initialized in DUMMY mode (no hardware required)")
            return True

        if not SCD40_AVAILABLE:
            self.logger.error("SCD40 library not available. Install: pip install adafruit-circuitpython-scd4x")
            return False

        try:
            # Initialize I2C and sensor
            i2c = board.I2C()
            self.sensor = adafruit_scd4x.SCD4X(i2c)

            # Start periodic measurement
            self.sensor.start_periodic_measurement()

            # Wait for first measurement
            time.sleep(5)

            self._initialized = True
            self.logger.info("SCD40 initialized")
            return True

        except Exception as e:
            self.logger.error(f"Failed to initialize SCD40: {e}")
            return False

    def read(self) -> Dict[str, Any]:
        """
        Read SCD40 sensor data

        Returns:
            Dictionary with CO2, temperature, humidity
        """
        if not self._initialized or not self.sensor:
            raise RuntimeError("SCD40 sensor not initialized")

        try:
            # Check if data is ready
            if self.sensor.data_ready:
                data = {
                    'co2': int(self.sensor.CO2),
                    'temperature': round(self.sensor.temperature, 2),
                    'humidity': round(self.sensor.relative_humidity, 2),
                    'co2_level': self._get_co2_level(self.sensor.CO2)
                }
                return data
            else:
                raise RuntimeError("SCD40 data not ready")

        except Exception as e:
            self.logger.error(f"Failed to read SCD40: {e}")
            raise

    def _get_co2_level(self, co2_ppm: int) -> str:
        """
        Determine CO2 level category

        Args:
            co2_ppm: CO2 concentration in ppm

        Returns:
            Level string: 'excellent', 'good', 'fair', 'poor', 'bad'
        """
        if co2_ppm < 400:
            return 'excellent'
        elif co2_ppm < 600:
            return 'good'
        elif co2_ppm < 1000:
            return 'fair'
        elif co2_ppm < 1500:
            return 'poor'
        else:
            return 'bad'

    def read_dummy(self) -> Dict[str, Any]:
        """
        Generate dummy SCD40 data for testing

        Returns:
            Dictionary with simulated sensor values
        """
        co2_value = int(self._random_value(800, 200))  # 600-1000 ppm
        return {
            'co2': co2_value,
            'temperature': round(self._random_value(23.0, 2.0), 2),  # 21-25°C
            'humidity': round(self._random_value(50.0, 8.0), 2),     # 42-58%
            'co2_level': self._get_co2_level(co2_value)
        }

    def _get_unit(self, metric_name: str) -> str:
        """Get unit for SCD40 metrics"""
        units = {
            'co2': 'ppm',
            'temperature': '°C',
            'humidity': '%',
            'co2_level': ''
        }
        return units.get(metric_name, '')

    def close(self):
        """Clean up SCD40 sensor"""
        try:
            if self.sensor:
                self.sensor.stop_periodic_measurement()
        except:
            pass

        self.sensor = None
        self._initialized = False
        self.logger.info("SCD40 sensor closed")
