#!/usr/bin/env python3
"""
SmartSense Sensor Node - Plug and Play Version

Automatic WiFi provisioning and server discovery
"""

import signal
import sys
import time
import traceback
import threading
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from utils import (
    setup_logger,
    load_config,
    get_node_info,
    WiFiProvisioning,
    ServiceDiscovery,
    ProvisioningServer,
    NetworkChecker
)
from sensors import BME680Sensor, SCD40Sensor, PMS5003Sensor, BH1750Sensor
from mqtt import MQTTClient
from outputs import LEDController, BuzzerController


class SensorNode:
    """Sensor Node with Plug and Play support"""

    def __init__(self, config_path: str = "config.yaml"):
        # Load configuration
        self.config = load_config(config_path)

        # Get mode (dev or production)
        self.mode = self.config.get('mode', 'dev')

        # Setup logger
        log_config = self.config.get('logging', {})
        self.logger = setup_logger(
            name="smartsense",
            level=log_config.get('level', 'INFO'),
        )

        self.logger.info("=" * 60)
        self.logger.info(f"SmartSense Sensor Node - {self.mode.upper()} mode")
        self.logger.info("=" * 60)

        # Initialize components (only in production mode)
        self.wifi_prov = WiFiProvisioning() if self.mode == 'production' else None
        self.discovery = ServiceDiscovery() if self.mode == 'production' else None
        self.web_server = None

        self.sensors = []
        self.mqtt_client = None
        self.led = None
        self.buzzer = None

        self.running = False
        self.server_info = None

        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.logger.info(f"Received signal {signum}, shutting down...")
        self.running = False

    def setup(self) -> bool:
        """Setup sensor node with automatic configuration"""
        try:
            # Initialize LED and Buzzer
            self._init_outputs()

            # DEV mode: Skip network setup, use config values
            if self.mode == 'dev':
                self.logger.info("DEV mode: Skipping network configuration")
                mqtt_config = self.config.get('mqtt', {})
                self.server_info = {
                    'address': mqtt_config.get('broker_host', 'localhost'),
                    'mqtt_port': mqtt_config.get('broker_port', 1883),
                    'api_port': 3000
                }
                self.logger.info(f"Using configured server: {self.server_info['address']}")

            # PRODUCTION mode: Full Plug and Play
            else:
                # Step 1: Check network connection
                self.logger.info("Checking network connection...")
                connection = NetworkChecker.get_active_connection()

                if connection['type'] != 'none':
                    self.logger.info(f"✓ Network connected ({connection['type']}): {connection['ip']}")
                    self.led.flash(LEDController.COLOR_GREEN, times=2)
                    self.buzzer.beep(duration=0.1, times=1)
                else:
                    # No network - WiFi provisioning
                    self.logger.warning("No network connection")
                    if self.wifi_prov.has_wifi_config():
                        wifi_config = self.wifi_prov.load_config()
                        if self.wifi_prov.connect_wifi(wifi_config['ssid'], wifi_config['password']):
                            self.logger.info("✓ WiFi connected")
                        else:
                            return self._start_provisioning_mode()
                    else:
                        return self._start_provisioning_mode()

                # Discover server via mDNS
                self.logger.info("Discovering SmartSense server...")
                self.server_info = self.discovery.discover(timeout=15)

                if not self.server_info:
                    self.logger.error("Server not found")
                    return False

                self.logger.info(f"Server found: {self.server_info['address']}")

            # Initialize sensors
            if not self._initialize_sensors():
                self.logger.error("Failed to initialize sensors")
                return False

            # Connect to MQTT
            if self.mode == 'production':
                mqtt_url = self.discovery.get_mqtt_broker_url(self.server_info)
            else:
                mqtt_url = None

            if not self._connect_mqtt(mqtt_url):
                self.logger.error("Failed to connect to MQTT broker")
                return False

            # Setup complete
            self.logger.info("Setting up LED/Buzzer status...")
            if self.led.enabled:
                self.led.status_ok()
            if self.buzzer.enabled:
                self.buzzer.beep(duration=0.1, times=3)
            self.logger.info("Setup complete!")

            return True

        except Exception as e:
            self.logger.error(f"Setup failed: {e}")
            import traceback
            self.logger.error(traceback.format_exc())
            return False

    def _init_outputs(self):
        """Initialize LED and Buzzer"""
        led_config = self.config.get('outputs', {}).get('led', {})
        self.led = LEDController(
            gpio_pin=led_config.get('gpio_pin', 18),
            enabled=led_config.get('enabled', True)
        )
        self.led.initialize()

        buzzer_config = self.config.get('outputs', {}).get('buzzer', {})
        self.buzzer = BuzzerController(
            gpio_pin=buzzer_config.get('gpio_pin', 27),
            enabled=buzzer_config.get('enabled', True)
        )
        self.buzzer.initialize()

    def _start_provisioning_mode(self) -> bool:
        """Start WiFi provisioning mode"""
        self.logger.info("Starting provisioning mode...")
        self.logger.info(f"AP SSID: {self.wifi_prov.ap_ssid}")
        self.logger.info(f"AP Password: {self.wifi_prov.ap_password}")

        # Start AP mode
        if not self.wifi_prov.start_ap_mode():
            self.logger.error("Failed to start AP mode")
            return False

        # Indicate provisioning mode with LED
        self.led.flash(LEDController.COLOR_BLUE, duration=0.5, times=5)

        # Start web server
        self.logger.info(f"Web server: http://{self.wifi_prov.ap_ip}")
        self.web_server = ProvisioningServer(port=80)

        # Run server in thread
        server_thread = threading.Thread(
            target=self.web_server.start,
            args=(self._on_wifi_configured,),
            daemon=True
        )
        server_thread.start()

        self.logger.info("Waiting for WiFi configuration...")
        self.logger.info(f"1. Connect to WiFi: {self.wifi_prov.ap_ssid}")
        self.logger.info(f"2. Open http://{self.wifi_prov.ap_ip}")
        self.logger.info("3. Enter your WiFi credentials")

        # Wait for configuration
        while not self.wifi_prov.has_wifi_config():
            time.sleep(1)
            self.led.flash(LEDController.COLOR_BLUE, duration=0.2, times=1)

        return True

    def _on_wifi_configured(self, ssid: str, password: str) -> bool:
        """Callback when WiFi is configured"""
        self.logger.info(f"WiFi configured: {ssid}")

        # Save configuration
        if not self.wifi_prov.save_config(ssid, password):
            return False

        # Connect to WiFi
        self.led.flash(LEDController.COLOR_YELLOW, times=3)
        if self.wifi_prov.connect_wifi(ssid, password):
            self.logger.info("WiFi connected successfully")
            self.led.status_ok()
            self.buzzer.beep(duration=0.2, times=2)

            # Stop web server
            if self.web_server:
                self.web_server.stop()

            return True
        else:
            self.logger.error("WiFi connection failed")
            self.led.status_error()
            return False

    def _initialize_sensors(self) -> bool:
        """Initialize all enabled sensors"""
        from utils.config_loader import get_sensor_config

        sensor_classes = {
            'bme680': BME680Sensor,
            'scd40': SCD40Sensor,
            'pms5003': PMS5003Sensor,
            'bh1750': BH1750Sensor
        }

        for sensor_name, sensor_class in sensor_classes.items():
            sensor_config = get_sensor_config(self.config, sensor_name)

            if sensor_config:
                self.logger.info(f"Initializing {sensor_name}...")
                try:
                    sensor = sensor_class(sensor_config)
                    if sensor.initialize():
                        self.sensors.append(sensor)
                        self.logger.info(f"✓ {sensor_name} initialized")
                    else:
                        self.logger.warning(f"✗ {sensor_name} initialization failed")
                except Exception as e:
                    self.logger.error(f"✗ {sensor_name} error: {e}")

        if not self.sensors:
            self.logger.error("No sensors initialized!")
            return False

        self.logger.info(f"Total sensors initialized: {len(self.sensors)}")
        return True

    def _connect_mqtt(self, broker_url: str = None) -> bool:
        """Connect to MQTT broker"""
        node_info = get_node_info(self.config)
        mqtt_config = {
            'broker_host': self.server_info['address'],
            'broker_port': int(self.server_info['mqtt_port'])
        }

        self.mqtt_client = MQTTClient(mqtt_config, node_info)

        if not self.mqtt_client.connect():
            return False

        # Publish birth certificate
        self.logger.info("Publishing birth certificate...")
        birth_metrics = self._get_birth_metrics()
        self.mqtt_client.publish_birth(birth_metrics)
        self.logger.info("Birth certificate published")

        return True

    def _get_birth_metrics(self):
        """Get birth metrics for all sensors"""
        metrics = []
        timestamp = int(time.time() * 1000)

        for sensor in self.sensors:
            try:
                sensor_metrics = sensor.get_metrics(timestamp)
                metrics.extend(sensor_metrics)
            except Exception as e:
                self.logger.error(f"Failed to get metrics from {sensor.name}: {e}")

        return metrics

    def run(self):
        """Main run loop"""
        self.running = True
        self.logger.info("Starting main loop...")

        # Get read interval
        read_interval = 60
        for sensor_name in ['bme680', 'scd40', 'pms5003', 'bh1750']:
            from utils.config_loader import get_sensor_config
            sensor_config = get_sensor_config(self.config, sensor_name)
            if sensor_config:
                read_interval = sensor_config.get('read_interval', 60)
                break

        self.logger.info(f"Read interval: {read_interval} seconds")

        last_read_time = 0

        while self.running:
            try:
                current_time = time.time()

                # Read and publish data
                if current_time - last_read_time >= read_interval:
                    self._read_and_publish()
                    last_read_time = current_time

                # Check MQTT connection
                if not self.mqtt_client.connected:
                    self.logger.warning("MQTT disconnected, reconnecting...")
                    self.led.status_warning()
                    if self.mqtt_client.connect():
                        self.mqtt_client.publish_birth(self._get_birth_metrics())
                        self.led.status_ok()

                time.sleep(1)

            except Exception as e:
                self.logger.error(f"Error in main loop: {e}")
                self.logger.error(traceback.format_exc())
                self.led.flash(LEDController.COLOR_RED, times=3)
                time.sleep(5)

        self.logger.info("Main loop stopped")

    def _read_and_publish(self):
        """Read all sensors and publish data"""
        try:
            metrics = []
            timestamp = int(time.time() * 1000)

            for sensor in self.sensors:
                try:
                    sensor_metrics = sensor.get_metrics(timestamp)
                    metrics.extend(sensor_metrics)
                    self.logger.debug(f"Read {len(sensor_metrics)} metrics from {sensor.name}")
                except Exception as e:
                    self.logger.error(f"Failed to read {sensor.name}: {e}")

            if metrics:
                if self.mqtt_client.publish_data(metrics):
                    self.logger.info(f"Published {len(metrics)} metrics")
                    self.led.flash(LEDController.COLOR_GREEN, duration=0.1, times=1)
                else:
                    self.logger.warning("Failed to publish data")
                    self.led.flash(LEDController.COLOR_YELLOW, times=2)
            else:
                self.logger.warning("No metrics to publish")

        except Exception as e:
            self.logger.error(f"Error reading and publishing: {e}")
            self.logger.error(traceback.format_exc())

    def shutdown(self):
        """Cleanup and shutdown"""
        self.logger.info("Shutting down...")

        self.running = False

        if self.mqtt_client:
            self.mqtt_client.disconnect()

        for sensor in self.sensors:
            try:
                sensor.close()
            except Exception as e:
                self.logger.error(f"Error closing {sensor.name}: {e}")

        if self.led:
            self.led.status_error()
            time.sleep(0.5)
            self.led.close()

        if self.buzzer:
            self.buzzer.beep(duration=0.2, times=1)
            self.buzzer.close()

        self.logger.info("Shutdown complete")


def main():
    """Main entry point"""
    try:
        node = SensorNode()

        if not node.setup():
            sys.exit(1)

        node.run()

    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)

    finally:
        if 'node' in locals():
            node.shutdown()


if __name__ == "__main__":
    main()
