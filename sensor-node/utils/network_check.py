"""
Network connectivity checker
"""

import logging
import subprocess
import platform
from typing import Optional, Dict

logger = logging.getLogger("smartsense.network")


class NetworkChecker:
    """
    Check network connectivity (Ethernet and WiFi)
    """

    @staticmethod
    def is_ethernet_connected() -> bool:
        """
        Check if Ethernet (eth0) is connected

        Returns:
            True if Ethernet is connected and has IP
        """
        # Skip on non-Linux platforms
        if platform.system() != 'Linux':
            logger.debug("Ethernet check skipped on non-Linux platform")
            return False

        try:
            # Check if eth0 exists and is up
            result = subprocess.run(
                ["cat", "/sys/class/net/eth0/operstate"],
                capture_output=True,
                text=True,
                timeout=2
            )

            if result.returncode != 0:
                logger.debug("Ethernet interface not found")
                return False

            state = result.stdout.strip()
            if state != "up":
                logger.debug(f"Ethernet state: {state}")
                return False

            # Check if it has an IP address
            ip = NetworkChecker.get_ethernet_ip()
            if ip:
                logger.info(f"Ethernet connected: {ip}")
                return True

            return False

        except Exception as e:
            logger.debug(f"Ethernet check error: {e}")
            return False

    @staticmethod
    def get_ethernet_ip() -> Optional[str]:
        """
        Get Ethernet IP address

        Returns:
            IP address or None
        """
        if platform.system() != 'Linux':
            return None

        try:
            result = subprocess.run(
                ["ip", "-4", "addr", "show", "eth0"],
                capture_output=True,
                text=True,
                timeout=2
            )

            if result.returncode != 0:
                return None

            # Parse IP address from output
            for line in result.stdout.split('\n'):
                if 'inet ' in line:
                    ip = line.strip().split()[1].split('/')[0]
                    return ip

            return None

        except Exception as e:
            logger.debug(f"Failed to get Ethernet IP: {e}")
            return None

    @staticmethod
    def is_wifi_connected() -> bool:
        """
        Check if WiFi (wlan0) is connected

        Returns:
            True if WiFi is connected
        """
        if platform.system() != 'Linux':
            logger.debug("WiFi check skipped on non-Linux platform")
            return False

        try:
            result = subprocess.run(
                ["iwgetid", "-r"],
                capture_output=True,
                text=True,
                timeout=2
            )

            ssid = result.stdout.strip()
            if ssid:
                logger.info(f"WiFi connected: {ssid}")
                return True

            return False

        except Exception as e:
            logger.debug(f"WiFi check error: {e}")
            return False

    @staticmethod
    def get_wifi_ip() -> Optional[str]:
        """
        Get WiFi IP address

        Returns:
            IP address or None
        """
        if platform.system() != 'Linux':
            return None

        try:
            result = subprocess.run(
                ["ip", "-4", "addr", "show", "wlan0"],
                capture_output=True,
                text=True,
                timeout=2
            )

            if result.returncode != 0:
                return None

            # Parse IP address from output
            for line in result.stdout.split('\n'):
                if 'inet ' in line:
                    ip = line.strip().split()[1].split('/')[0]
                    return ip

            return None

        except Exception as e:
            logger.debug(f"Failed to get WiFi IP: {e}")
            return None

    @staticmethod
    def get_active_connection() -> Dict[str, str]:
        """
        Get currently active network connection

        Returns:
            Dict with 'type' (ethernet/wifi/none) and 'ip'
        """
        # Check Ethernet first (preferred)
        if NetworkChecker.is_ethernet_connected():
            ip = NetworkChecker.get_ethernet_ip()
            return {
                'type': 'ethernet',
                'ip': ip,
                'interface': 'eth0'
            }

        # Check WiFi
        if NetworkChecker.is_wifi_connected():
            ip = NetworkChecker.get_wifi_ip()
            return {
                'type': 'wifi',
                'ip': ip,
                'interface': 'wlan0'
            }

        # No connection
        return {
            'type': 'none',
            'ip': None,
            'interface': None
        }

    @staticmethod
    def wait_for_network(timeout: int = 30) -> bool:
        """
        Wait for network connection (Ethernet or WiFi)

        Args:
            timeout: Maximum wait time in seconds

        Returns:
            True if network is available
        """
        import time

        logger.info(f"Waiting for network connection (timeout: {timeout}s)...")

        start_time = time.time()
        while time.time() - start_time < timeout:
            connection = NetworkChecker.get_active_connection()

            if connection['type'] != 'none':
                logger.info(f"Network available: {connection['type']} ({connection['ip']})")
                return True

            time.sleep(2)

        logger.warning("Network connection timeout")
        return False

    @staticmethod
    def test_internet_connectivity() -> bool:
        """
        Test if internet is accessible (ping Google DNS)

        Returns:
            True if internet is accessible
        """
        try:
            # Use platform-specific ping command
            if platform.system() == 'Windows':
                cmd = ["ping", "-n", "1", "-w", "2000", "8.8.8.8"]
            else:
                cmd = ["ping", "-c", "1", "-W", "2", "8.8.8.8"]

            result = subprocess.run(
                cmd,
                capture_output=True,
                timeout=3
            )
            return result.returncode == 0

        except Exception as e:
            logger.debug(f"Internet test failed: {e}")
            return False
