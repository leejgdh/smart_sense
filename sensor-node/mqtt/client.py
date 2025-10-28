"""
MQTT Client for SmartSense Sensor Node
"""

import json
import logging
import time
from typing import Dict, Any, List, Callable, Optional
import paho.mqtt.client as mqtt


class MQTTClient:
    """
    Simple MQTT Client for IoT sensor data
    """

    def __init__(self, config: Dict[str, Any], node_info: Dict[str, Any]):
        """
        Initialize MQTT client

        Args:
            config: MQTT configuration
            node_info: Node information
        """
        self.logger = logging.getLogger("smartsense.mqtt")
        self.config = config
        self.node_info = node_info

        # MQTT settings
        self.broker_host = config.get('broker_host', 'localhost')
        self.broker_port = config.get('broker_port', 1883)
        self.username = config.get('username')
        self.password = config.get('password')
        self.use_tls = config.get('use_tls', False)

        # Node ID for topic construction
        self.node_id = node_info.get('id', 'sensor-node-01')
        self.client_id = f"smartsense-{self.node_id}"

        # Topic structure
        self.topic_base = f"smartsense/{self.node_id}"
        self.topic_status = f"{self.topic_base}/status"
        self.topic_sensors = f"{self.topic_base}/sensors"
        self.topic_command = f"{self.topic_base}/command"

        # MQTT client
        self.client = mqtt.Client(client_id=self.client_id, clean_session=False)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message

        # Callbacks
        self.on_command_callback: Optional[Callable] = None

        # Connection state
        self.connected = False

        # Set Last Will and Testament (offline status)
        offline_status = json.dumps({
            'node_id': self.node_id,
            'status': 'offline',
            'timestamp': int(time.time() * 1000)
        })
        self.client.will_set(self.topic_status, offline_status, qos=1, retain=True)

    def connect(self) -> bool:
        """
        Connect to MQTT broker

        Returns:
            True if connection successful
        """
        try:
            # Set credentials if provided
            if self.username and self.password:
                self.client.username_pw_set(self.username, self.password)

            # Set TLS if enabled
            if self.use_tls:
                self.client.tls_set()

            # Connect to broker
            self.logger.info(f"Connecting to MQTT broker at {self.broker_host}:{self.broker_port}")
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)

            # Start network loop
            self.client.loop_start()

            # Wait for connection
            timeout = 10
            start_time = time.time()
            while not self.connected and (time.time() - start_time) < timeout:
                time.sleep(0.1)

            if self.connected:
                self.logger.info("MQTT connected successfully")
                return True
            else:
                self.logger.error("MQTT connection timeout")
                return False

        except Exception as e:
            self.logger.error(f"Failed to connect to MQTT broker: {e}")
            return False

    def disconnect(self):
        """Disconnect from MQTT broker"""
        try:
            # Publish offline status
            self.publish_status('offline')

            # Disconnect
            self.client.loop_stop()
            self.client.disconnect()
            self.connected = False
            self.logger.info("MQTT disconnected")

        except Exception as e:
            self.logger.error(f"Error during disconnect: {e}")

    def publish_status(self, status: str = 'online') -> bool:
        """
        Publish node status (online/offline)

        Args:
            status: Node status ('online' or 'offline')

        Returns:
            True if publish successful
        """
        try:
            payload = json.dumps({
                'node_id': self.node_id,
                'status': status,
                'location': self.node_info.get('location', ''),
                'description': self.node_info.get('description', ''),
                'timestamp': int(time.time() * 1000)
            })

            result = self.client.publish(self.topic_status, payload, qos=1, retain=True)
            # Wait for publish with timeout
            if result.rc == 0:
                self.logger.info(f"Published status: {status}")
                return True
            else:
                self.logger.error(f"Failed to publish status, return code: {result.rc}")
                return False

        except Exception as e:
            self.logger.error(f"Failed to publish status: {e}")
            return False

    def publish_birth(self, metrics: List[Dict[str, Any]] = None) -> bool:
        """
        Publish birth message (node online with sensor list)

        Args:
            metrics: List of available sensors/metrics (optional)

        Returns:
            True if publish successful
        """
        # For compatibility, just publish online status
        return self.publish_status('online')

    def publish_data(self, metrics: List[Dict[str, Any]]) -> bool:
        """
        Publish sensor data

        Args:
            metrics: List of sensor readings
                    Each metric should have: name, value, unit, timestamp

        Returns:
            True if publish successful
        """
        try:
            # Convert metrics list to dictionary format
            sensor_data = {
                'node_id': self.node_id,
                'timestamp': int(time.time() * 1000),
                'sensors': {}
            }

            for metric in metrics:
                sensor_name = metric.get('name', 'unknown')
                sensor_data['sensors'][sensor_name] = {
                    'value': metric.get('value'),
                    'unit': metric.get('unit', ''),
                    'timestamp': metric.get('timestamp', sensor_data['timestamp'])
                }

            payload = json.dumps(sensor_data)
            self.client.publish(self.topic_sensors, payload, qos=0, retain=False)

            self.logger.debug(f"Published sensor data with {len(metrics)} metrics")
            return True

        except Exception as e:
            self.logger.error(f"Failed to publish sensor data: {e}")
            return False

    def publish_death(self) -> bool:
        """
        Publish death message (node going offline)

        Returns:
            True if publish successful
        """
        return self.publish_status('offline')

    def set_command_callback(self, callback: Callable):
        """
        Set callback for command messages

        Args:
            callback: Function to call when command received
                     Signature: callback(command: dict)
        """
        self.on_command_callback = callback

    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to broker"""
        if rc == 0:
            self.connected = True
            self.logger.info("Connected to MQTT broker")

            # Subscribe to command topic
            self.client.subscribe(self.topic_command, qos=1)
            self.logger.info(f"Subscribed to command topic: {self.topic_command}")

            # Publish online status
            self.publish_status('online')

        else:
            self.connected = False
            error_messages = {
                1: "Incorrect protocol version",
                2: "Invalid client identifier",
                3: "Server unavailable",
                4: "Bad username or password",
                5: "Not authorized"
            }
            error_msg = error_messages.get(rc, f"Unknown error (code: {rc})")
            self.logger.error(f"Connection failed: {error_msg}")

    def _on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from broker"""
        self.connected = False
        if rc != 0:
            self.logger.warning(f"Unexpected disconnect (code: {rc})")
        else:
            self.logger.info("Disconnected from MQTT broker")

    def _on_message(self, client, userdata, msg):
        """Callback when message received"""
        try:
            self.logger.debug(f"Received message on topic: {msg.topic}")

            # Parse JSON command
            command = json.loads(msg.payload.decode('utf-8'))

            # Call command callback if set
            if self.on_command_callback:
                self.on_command_callback(command)

        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in message: {e}")
        except Exception as e:
            self.logger.error(f"Error processing message: {e}")
