"""
BME680 Sensor Driver - Temperature, Humidity, Pressure, VOC
"""

from typing import Dict, Any
from .base_sensor import BaseSensor

try:
    import bme680
    import smbus2
    BME680_AVAILABLE = True
except ImportError:
    BME680_AVAILABLE = False


class BME680Sensor(BaseSensor):
    """
    BME680 environmental sensor
    Measures: Temperature, Humidity, Pressure, Gas Resistance (VOC)
    """

    def __init__(self, config: Dict[str, Any]):
        super().__init__("BME680", config)
        self.sensor = None
        self.i2c_address = config.get('i2c_address', 0x76)

    def initialize(self) -> bool:
        """Initialize BME680 sensor"""
        # If using dummy data, skip hardware initialization
        if self.use_dummy:
            self._initialized = True
            self.logger.info("BME680 initialized in DUMMY mode (no hardware required)")
            return True

        if not BME680_AVAILABLE:
            self.logger.error("BME680 library not available. Install: pip install bme680")
            return False

        try:
            # Initialize sensor
            self.sensor = bme680.BME680(self.i2c_address)

            # Configure oversampling
            self.sensor.set_humidity_oversample(bme680.OS_2X)
            self.sensor.set_pressure_oversample(bme680.OS_4X)
            self.sensor.set_temperature_oversample(bme680.OS_8X)
            self.sensor.set_filter(bme680.FILTER_SIZE_3)

            # Configure gas sensor
            self.sensor.set_gas_status(bme680.ENABLE_GAS_MEAS)
            self.sensor.set_gas_heater_temperature(320)
            self.sensor.set_gas_heater_duration(150)
            self.sensor.select_gas_heater_profile(0)

            self._initialized = True
            self.logger.info(f"BME680 initialized at address 0x{self.i2c_address:02X}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to initialize BME680: {e}")
            return False

    def read(self) -> Dict[str, Any]:
        """
        Read BME680 sensor data

        Returns:
            Dictionary with temperature, humidity, pressure, gas_resistance
        """
        if not self._initialized or not self.sensor:
            raise RuntimeError("BME680 sensor not initialized")

        try:
            # Get sensor data
            if self.sensor.get_sensor_data():
                data = {
                    'temperature': round(self.sensor.data.temperature, 2),
                    'humidity': round(self.sensor.data.humidity, 2),
                    'pressure': round(self.sensor.data.pressure, 2),
                }

                # Add gas resistance if available
                if self.sensor.data.heat_stable:
                    data['gas_resistance'] = round(self.sensor.data.gas_resistance, 0)
                    # Calculate air quality index (simple calculation)
                    data['air_quality_score'] = self._calculate_air_quality(
                        self.sensor.data.gas_resistance
                    )

                return data
            else:
                raise RuntimeError("Failed to get sensor data")

        except Exception as e:
            self.logger.error(f"Failed to read BME680: {e}")
            raise

    def _calculate_air_quality(self, gas_resistance: float) -> int:
        """
        Calculate simple air quality score from gas resistance
        Higher gas resistance = better air quality

        Args:
            gas_resistance: Gas resistance in Ohms

        Returns:
            Air quality score (0-100, higher is better)
        """
        # Simple linear mapping
        # Good: > 50kΩ, Bad: < 5kΩ
        min_resistance = 5000
        max_resistance = 50000

        if gas_resistance >= max_resistance:
            return 100
        elif gas_resistance <= min_resistance:
            return 0
        else:
            score = ((gas_resistance - min_resistance) /
                    (max_resistance - min_resistance)) * 100
            return int(score)

    def read_dummy(self) -> Dict[str, Any]:
        """
        Generate dummy BME680 data for testing

        Returns:
            Dictionary with simulated sensor values
        """
        return {
            'temperature': round(self._random_value(23.0, 3.0), 2),  # 20-26°C
            'humidity': round(self._random_value(50.0, 10.0), 2),    # 40-60%
            'pressure': round(self._random_value(1013.0, 5.0), 2),   # 1008-1018 hPa
            'gas_resistance': round(self._random_value(30000, 10000), 0),  # 20k-40k Ohm
            'air_quality_score': int(self._random_value(70, 15))     # 55-85
        }

    def _get_unit(self, metric_name: str) -> str:
        """Get unit for BME680 metrics"""
        units = {
            'temperature': '°C',
            'humidity': '%',
            'pressure': 'hPa',
            'gas_resistance': 'Ohm',
            'air_quality_score': 'score'
        }
        return units.get(metric_name, '')

    def close(self):
        """Clean up BME680 sensor"""
        self.sensor = None
        self._initialized = False
        self.logger.info("BME680 sensor closed")
