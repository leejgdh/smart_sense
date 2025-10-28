"""
Base sensor class for SmartSense
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List
import logging
import random


class BaseSensor(ABC):
    """
    Abstract base class for all sensors
    """

    def __init__(self, name: str, config: Dict[str, Any]):
        """
        Initialize sensor

        Args:
            name: Sensor name
            config: Sensor configuration dictionary
        """
        self.name = name
        self.config = config
        self.logger = logging.getLogger(f"smartsense.sensor.{name}")
        self._initialized = False
        self.use_dummy = config.get('use_dummy', False)

    @abstractmethod
    def initialize(self) -> bool:
        """
        Initialize sensor hardware

        Returns:
            True if initialization successful, False otherwise
        """
        pass

    @abstractmethod
    def read(self) -> Dict[str, Any]:
        """
        Read sensor data

        Returns:
            Dictionary containing sensor readings
            Example: {'temperature': 25.5, 'humidity': 45.2}

        Raises:
            Exception if reading fails
        """
        pass

    @abstractmethod
    def read_dummy(self) -> Dict[str, Any]:
        """
        Generate dummy sensor data (for testing without hardware)

        Returns:
            Dictionary containing simulated sensor readings
        """
        pass

    @abstractmethod
    def close(self):
        """
        Clean up sensor resources
        """
        pass

    def get_metrics(self, timestamp: int) -> List[Dict[str, Any]]:
        """
        Get sensor data in metrics format

        Args:
            timestamp: Unix timestamp in milliseconds

        Returns:
            List of metrics dictionaries
        """
        try:
            # Use dummy data if configured
            if self.use_dummy:
                data = self.read_dummy()
            else:
                data = self.read()

            metrics = []

            for key, value in data.items():
                metric = {
                    'name': f"{self.name}/{key}",
                    'timestamp': timestamp,
                    'value': value,
                    'unit': self._get_unit(key)
                }
                metrics.append(metric)

            return metrics

        except Exception as e:
            self.logger.error(f"Failed to get metrics: {e}")
            return []

    def _get_unit(self, metric_name: str) -> str:
        """
        Get unit for metric (override in subclass for specific units)

        Args:
            metric_name: Name of the metric

        Returns:
            Unit string
        """
        return ''

    @staticmethod
    def _random_value(base: float, variance: float) -> float:
        """
        Generate random value with variance

        Args:
            base: Base value
            variance: Maximum variance (+/-)

        Returns:
            Random value within range
        """
        return base + random.uniform(-variance, variance)

    @property
    def is_initialized(self) -> bool:
        """Check if sensor is initialized"""
        return self._initialized
