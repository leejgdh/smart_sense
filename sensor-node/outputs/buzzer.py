"""
Buzzer Controller for audio alerts
"""

import logging
import time
from typing import Optional

try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False


class BuzzerController:
    """
    Buzzer controller for audio alerts
    """

    def __init__(self, gpio_pin: int = 27, enabled: bool = True):
        """
        Initialize buzzer controller

        Args:
            gpio_pin: GPIO pin number (BCM mode)
            enabled: Enable buzzer control
        """
        self.logger = logging.getLogger("smartsense.buzzer")
        self.gpio_pin = gpio_pin
        self.enabled = enabled
        self._initialized = False

        if not GPIO_AVAILABLE:
            self.logger.warning("RPi.GPIO not available. Buzzer control disabled.")
            self.enabled = False

    def initialize(self) -> bool:
        """
        Initialize GPIO for buzzer

        Returns:
            True if initialization successful
        """
        if not self.enabled:
            return True

        try:
            # Set GPIO mode
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)

            # Setup pin as output
            GPIO.setup(self.gpio_pin, GPIO.OUT)
            GPIO.output(self.gpio_pin, GPIO.LOW)

            self._initialized = True
            self.logger.info(f"Buzzer controller initialized on GPIO {self.gpio_pin}")

            # Short beep to indicate initialization
            self.beep(duration=0.1, times=1)

            return True

        except Exception as e:
            self.logger.error(f"Failed to initialize buzzer: {e}")
            return False

    def beep(self, duration: float = 0.2, times: int = 1, interval: float = 0.1):
        """
        Make beep sound

        Args:
            duration: Beep duration in seconds
            times: Number of beeps
            interval: Interval between beeps
        """
        if not self.enabled or not self._initialized:
            return

        try:
            for _ in range(times):
                GPIO.output(self.gpio_pin, GPIO.HIGH)
                time.sleep(duration)
                GPIO.output(self.gpio_pin, GPIO.LOW)

                if _ < times - 1:  # Don't wait after last beep
                    time.sleep(interval)

        except Exception as e:
            self.logger.error(f"Failed to beep: {e}")

    def alert_short(self):
        """Short alert (1 beep)"""
        self.beep(duration=0.2, times=1)

    def alert_medium(self):
        """Medium alert (2 beeps)"""
        self.beep(duration=0.3, times=2, interval=0.2)

    def alert_long(self):
        """Long alert (3 beeps)"""
        self.beep(duration=0.5, times=3, interval=0.3)

    def alert_critical(self):
        """Critical alert (rapid beeps)"""
        self.beep(duration=0.1, times=5, interval=0.1)

    def tone(self, frequency: int = 2000, duration: float = 0.5):
        """
        Generate tone with PWM

        Args:
            frequency: Frequency in Hz
            duration: Duration in seconds
        """
        if not self.enabled or not self._initialized:
            return

        try:
            pwm = GPIO.PWM(self.gpio_pin, frequency)
            pwm.start(50)  # 50% duty cycle
            time.sleep(duration)
            pwm.stop()

        except Exception as e:
            self.logger.error(f"Failed to generate tone: {e}")

    def close(self):
        """Clean up GPIO"""
        if self._initialized:
            try:
                GPIO.output(self.gpio_pin, GPIO.LOW)
                GPIO.cleanup(self.gpio_pin)
                self._initialized = False
                self.logger.info("Buzzer controller closed")
            except:
                pass
