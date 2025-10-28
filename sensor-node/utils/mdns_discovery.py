"""
mDNS Service Discovery
Auto-discover SmartSense server on local network
"""

import logging
import time
from typing import Optional, Dict

try:
    from zeroconf import ServiceBrowser, ServiceListener, Zeroconf
    MDNS_AVAILABLE = True
except ImportError:
    MDNS_AVAILABLE = False

logger = logging.getLogger("smartsense.mdns")


class SmartSenseServiceListener(ServiceListener):
    """Listener for SmartSense server discovery"""

    def __init__(self):
        self.server_info: Optional[Dict] = None
        self.found = False

    def add_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        info = zc.get_service_info(type_, name)
        if info:
            logger.info(f"SmartSense server found: {name}")

            # Parse server information
            addresses = [addr for addr in info.parsed_addresses()]
            if addresses:
                self.server_info = {
                    'name': name,
                    'address': addresses[0],
                    'port': info.port,
                    'mqtt_port': info.properties.get(b'mqtt_port', b'1883').decode(),
                    'api_port': info.properties.get(b'api_port', b'3000').decode(),
                }
                self.found = True
                logger.info(f"Server address: {self.server_info['address']}")
                logger.info(f"MQTT port: {self.server_info['mqtt_port']}")

    def remove_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        logger.info(f"SmartSense server removed: {name}")
        if self.server_info and self.server_info['name'] == name:
            self.server_info = None
            self.found = False

    def update_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        pass


class ServiceDiscovery:
    """
    mDNS Service Discovery for SmartSense server
    """

    SERVICE_TYPE = "_smartsense._tcp.local."

    def __init__(self):
        self.zeroconf: Optional[Zeroconf] = None
        self.browser: Optional[ServiceBrowser] = None
        self.listener: Optional[SmartSenseServiceListener] = None

    def discover(self, timeout: int = 10) -> Optional[Dict]:
        """
        Discover SmartSense server on local network

        Args:
            timeout: Discovery timeout in seconds

        Returns:
            Server information dict or None
        """
        if not MDNS_AVAILABLE:
            logger.error("mDNS not available. Install: pip install zeroconf")
            return None

        try:
            logger.info("Starting SmartSense server discovery...")

            self.zeroconf = Zeroconf()
            self.listener = SmartSenseServiceListener()
            self.browser = ServiceBrowser(
                self.zeroconf,
                self.SERVICE_TYPE,
                self.listener
            )

            # Wait for discovery
            start_time = time.time()
            while time.time() - start_time < timeout:
                if self.listener.found:
                    logger.info("Server discovered successfully")
                    return self.listener.server_info
                time.sleep(0.5)

            logger.warning("Server discovery timeout")
            return None

        except Exception as e:
            logger.error(f"Discovery failed: {e}")
            return None

        finally:
            self.close()

    def close(self):
        """Clean up resources"""
        if self.zeroconf:
            self.zeroconf.close()
            self.zeroconf = None

    def get_mqtt_broker_url(self, server_info: Dict) -> str:
        """
        Get MQTT broker URL from server info

        Args:
            server_info: Server information dict

        Returns:
            MQTT broker URL
        """
        address = server_info['address']
        port = server_info['mqtt_port']
        return f"mqtt://{address}:{port}"

    def get_api_url(self, server_info: Dict) -> str:
        """
        Get API URL from server info

        Args:
            server_info: Server information dict

        Returns:
            API URL
        """
        address = server_info['address']
        port = server_info['api_port']
        return f"http://{address}:{port}"
