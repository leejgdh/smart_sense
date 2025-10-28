"""
RGB LED Controller for status indication
"""

import logging
from typing import Tuple

try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False


class LEDController:
    """
    RGB LED controller for visual status indication
    """

    # Color presets (R, G, B) - 0-100 scale
    COLOR_OFF = (0, 0, 0)
    COLOR_GREEN = (0, 100, 0)      # Normal operation
    COLOR_YELLOW = (100, 100, 0)   # Warning
    COLOR_RED = (100, 0, 0)        # Error
    COLOR_BLUE = (0, 0, 100)       # Info
    COLOR_PURPLE = (100, 0, 100)   # Starting

    def __init__(self, gpio_pin: int = 18, enabled: bool = True):
        """
        Initialize LED controller

        Args:
            gpio_pin: GPIO pin number (BCM mode)
            enabled: Enable LED control
        """
        self.logger = logging.getLogger("smartsense.led")
        self.gpio_pin = gpio_pin
        self.enabled = enabled
        self._initialized = False

        if not GPIO_AVAILABLE:
            self.logger.warning("RPi.GPIO not available. LED control disabled.")
            self.enabled = False

    def initialize(self) -> bool:
        """
        Initialize GPIO for LED

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

            # Initialize PWM for RGB control (simplified single pin)
            self.pwm = GPIO.PWM(self.gpio_pin, 1000)  # 1kHz
            self.pwm.start(0)

            self._initialized = True
            self.logger.info(f"LED controller initialized on GPIO {self.gpio_pin}")

            # Flash to indicate initialization
            self.flash(self.COLOR_BLUE, duration=0.5, times=2)

            return True

        except Exception as e:
            self.logger.error(f"Failed to initialize LED: {e}")
            return False

    def set_color(self, r: int, g: int, b: int):
        """
        Set LED color (simplified for single pin)

        Args:
            r, g, b: RGB values (0-100)
        """
        if not self.enabled or not self._initialized:
            return

        try:
            # Calculate brightness (average of RGB)
            brightness = (r + g + b) / 3
            self.pwm.ChangeDutyCycle(brightness)

        except Exception as e:
            self.logger.error(f"Failed to set LED color: {e}")

    def status_ok(self):
        """Set LED to green (normal operation)"""
        self.set_color(*self.COLOR_GREEN)

    def status_warning(self):
        """Set LED to yellow (warning)"""
        self.set_color(*self.COLOR_YELLOW)

    def status_error(self):
        """Set LED to red (error)"""
        self.set_color(*self.COLOR_RED)

    def status_info(self):
        """Set LED to blue (info)"""
        self.set_color(*self.COLOR_BLUE)

    def off(self):
        """Turn off LED"""
        self.set_color(*self.COLOR_OFF)

    def flash(self, color: Tuple[int, int, int] = COLOR_YELLOW,
              duration: float = 0.2, times: int = 3):
        """
        Flash LED

        Args:
            color: RGB color tuple
            duration: Flash duration in seconds
            times: Number of flashes
        """
        if not self.enabled or not self._initialized:
            return

        try:
            import time
            for _ in range(times):
                self.set_color(*color)
                time.sleep(duration)
                self.off()
                time.sleep(duration)

        except Exception as e:
            self.logger.error(f"Failed to flash LED: {e}")

    def close(self):
        """Clean up GPIO"""
        if self._initialized:
            try:
                self.off()
                self.pwm.stop()
                GPIO.cleanup(self.gpio_pin)
                self._initialized = False
                self.logger.info("LED controller closed")
            except:
                pass
