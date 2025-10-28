"""
BH1750 Sensor Driver - Light Intensity
"""

from typing import Dict, Any
import time
from .base_sensor import BaseSensor

try:
    import smbus2
    BH1750_AVAILABLE = True
except ImportError:
    BH1750_AVAILABLE = False


class BH1750Sensor(BaseSensor):
    """
    BH1750 light intensity sensor
    Measures: Illuminance (lux)
    """

    # I2C Commands
    POWER_DOWN = 0x00
    POWER_ON = 0x01
    RESET = 0x07
    CONTINUOUS_HIGH_RES_MODE = 0x10

    def __init__(self, config: Dict[str, Any]):
        super().__init__("BH1750", config)
        self.i2c_address = config.get('i2c_address', 0x23)
        self.bus = None

    def initialize(self) -> bool:
        """Initialize BH1750 sensor"""
        # If using dummy data, skip hardware initialization
        if self.use_dummy:
            self._initialized = True
            self.logger.info("BH1750 initialized in DUMMY mode (no hardware required)")
            return True

        if not BH1750_AVAILABLE:
            self.logger.error("smbus2 library not available. Install: pip install smbus2")
            return False

        try:
            # Open I2C bus (1 for Raspberry Pi)
            self.bus = smbus2.SMBus(1)

            # Power on and reset
            self.bus.write_byte(self.i2c_address, self.POWER_ON)
            time.sleep(0.01)
            self.bus.write_byte(self.i2c_address, self.RESET)
            time.sleep(0.01)

            # Set continuous high resolution mode
            self.bus.write_byte(self.i2c_address, self.CONTINUOUS_HIGH_RES_MODE)
            time.sleep(0.2)

            self._initialized = True
            self.logger.info(f"BH1750 initialized at address 0x{self.i2c_address:02X}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to initialize BH1750: {e}")
            return False

    def read(self) -> Dict[str, Any]:
        """
        Read BH1750 sensor data

        Returns:
            Dictionary with illuminance in lux
        """
        if not self._initialized or not self.bus:
            raise RuntimeError("BH1750 sensor not initialized")

        try:
            # Read 2 bytes
            data = self.bus.read_i2c_block_data(self.i2c_address, self.CONTINUOUS_HIGH_RES_MODE, 2)

            # Convert to lux
            lux = (data[0] << 8 | data[1]) / 1.2

            result = {
                'illuminance': round(lux, 2),
                'light_level': self._get_light_level(lux)
            }

            return result

        except Exception as e:
            self.logger.error(f"Failed to read BH1750: {e}")
            raise

    def _get_light_level(self, lux: float) -> str:
        """
        Determine light level category

        Args:
            lux: Illuminance in lux

        Returns:
            Level string
        """
        if lux < 10:
            return 'dark'
        elif lux < 50:
            return 'dim'
        elif lux < 200:
            return 'low'
        elif lux < 500:
            return 'medium'
        elif lux < 1000:
            return 'bright'
        else:
            return 'very_bright'

    def read_dummy(self) -> Dict[str, Any]:
        """
        Generate dummy BH1750 data for testing

        Returns:
            Dictionary with simulated sensor values
        """
        lux_value = self._random_value(300, 150)  # 150-450 lux
        return {
            'illuminance': round(lux_value, 2),
            'light_level': self._get_light_level(lux_value)
        }

    def _get_unit(self, metric_name: str) -> str:
        """Get unit for BH1750 metrics"""
        units = {
            'illuminance': 'lux',
            'light_level': ''
        }
        return units.get(metric_name, '')

    def close(self):
        """Clean up BH1750 sensor"""
        try:
            if self.bus:
                self.bus.write_byte(self.i2c_address, self.POWER_DOWN)
                self.bus.close()
        except:
            pass

        self.bus = None
        self._initialized = False
        self.logger.info("BH1750 sensor closed")
