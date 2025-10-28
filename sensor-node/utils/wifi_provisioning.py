"""
WiFi Provisioning Module
Handles WiFi AP mode and configuration web server
"""

import logging
import json
import time
from pathlib import Path
from typing import Optional, Dict

try:
    import subprocess
    WIFI_AVAILABLE = True
except ImportError:
    WIFI_AVAILABLE = False

logger = logging.getLogger("smartsense.wifi")


class WiFiProvisioning:
    """
    WiFi Provisioning handler
    Creates AP mode and web server for WiFi configuration
    """

    def __init__(self, config_file: str = "wifi_config.json"):
        self.config_file = Path(config_file)
        self.ap_ssid = self._generate_ap_ssid()
        self.ap_password = "smartsense"
        self.ap_ip = "192.168.4.1"

    def _generate_ap_ssid(self) -> str:
        """Generate unique AP SSID using MAC address"""
        try:
            # Get MAC address
            result = subprocess.run(
                ["cat", "/sys/class/net/wlan0/address"],
                capture_output=True,
                text=True
            )
            mac = result.stdout.strip().replace(":", "")[-4:].upper()
            return f"SmartSense-{mac}"
        except:
            return "SmartSense-0000"

    def has_wifi_config(self) -> bool:
        """Check if WiFi configuration exists"""
        if not self.config_file.exists():
            return False

        try:
            config = self.load_config()
            return bool(config.get("ssid"))
        except:
            return False

    def load_config(self) -> Dict:
        """Load WiFi configuration"""
        if not self.config_file.exists():
            return {}

        try:
            with open(self.config_file, 'r') as f:
                return json.load(f)
        except:
            return {}

    def save_config(self, ssid: str, password: str) -> bool:
        """Save WiFi configuration"""
        try:
            config = {
                "ssid": ssid,
                "password": password,
                "timestamp": time.time()
            }

            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=2)

            logger.info(f"WiFi config saved: {ssid}")
            return True
        except Exception as e:
            logger.error(f"Failed to save WiFi config: {e}")
            return False

    def start_ap_mode(self) -> bool:
        """Start Access Point mode"""
        if not WIFI_AVAILABLE:
            logger.error("WiFi not available")
            return False

        try:
            logger.info(f"Starting AP mode: {self.ap_ssid}")

            # Stop wpa_supplicant
            subprocess.run(["sudo", "systemctl", "stop", "wpa_supplicant"], check=False)

            # Configure hostapd
            hostapd_conf = f"""
interface=wlan0
driver=nl80211
ssid={self.ap_ssid}
hw_mode=g
channel=6
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase={self.ap_password}
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
"""
            with open("/tmp/hostapd.conf", "w") as f:
                f.write(hostapd_conf)

            # Configure dnsmasq
            dnsmasq_conf = f"""
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
"""
            with open("/tmp/dnsmasq.conf", "w") as f:
                f.write(dnsmasq_conf)

            # Set static IP
            subprocess.run([
                "sudo", "ip", "addr", "add", f"{self.ap_ip}/24", "dev", "wlan0"
            ], check=False)

            # Start hostapd
            subprocess.Popen([
                "sudo", "hostapd", "/tmp/hostapd.conf"
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            time.sleep(2)

            # Start dnsmasq
            subprocess.Popen([
                "sudo", "dnsmasq", "-C", "/tmp/dnsmasq.conf", "-d"
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            logger.info(f"AP mode started: {self.ap_ssid}")
            logger.info(f"Connect to {self.ap_ssid} and visit http://{self.ap_ip}")
            return True

        except Exception as e:
            logger.error(f"Failed to start AP mode: {e}")
            return False

    def stop_ap_mode(self):
        """Stop Access Point mode"""
        try:
            subprocess.run(["sudo", "killall", "hostapd"], check=False)
            subprocess.run(["sudo", "killall", "dnsmasq"], check=False)
            subprocess.run([
                "sudo", "ip", "addr", "del", f"{self.ap_ip}/24", "dev", "wlan0"
            ], check=False)
            logger.info("AP mode stopped")
        except Exception as e:
            logger.error(f"Error stopping AP mode: {e}")

    def connect_wifi(self, ssid: str, password: str) -> bool:
        """Connect to WiFi network"""
        try:
            logger.info(f"Connecting to WiFi: {ssid}")

            # Stop AP mode
            self.stop_ap_mode()

            # Create wpa_supplicant config
            wpa_conf = f"""
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US

network={{
    ssid="{ssid}"
    psk="{password}"
    key_mgmt=WPA-PSK
}}
"""
            with open("/tmp/wpa_supplicant.conf", "w") as f:
                f.write(wpa_conf)

            # Copy to system location
            subprocess.run([
                "sudo", "cp", "/tmp/wpa_supplicant.conf",
                "/etc/wpa_supplicant/wpa_supplicant.conf"
            ], check=True)

            # Restart networking
            subprocess.run(["sudo", "systemctl", "restart", "wpa_supplicant"], check=True)
            subprocess.run(["sudo", "systemctl", "restart", "dhcpcd"], check=True)

            # Wait for connection
            for i in range(20):
                time.sleep(1)
                if self.is_connected():
                    logger.info("WiFi connected successfully")
                    return True

            logger.error("WiFi connection timeout")
            return False

        except Exception as e:
            logger.error(f"Failed to connect WiFi: {e}")
            return False

    def is_connected(self) -> bool:
        """Check if connected to WiFi"""
        try:
            result = subprocess.run(
                ["iwgetid", "-r"],
                capture_output=True,
                text=True,
                timeout=2
            )
            return bool(result.stdout.strip())
        except:
            return False

    def get_ip_address(self) -> Optional[str]:
        """Get current IP address"""
        try:
            result = subprocess.run(
                ["hostname", "-I"],
                capture_output=True,
                text=True,
                timeout=2
            )
            ip = result.stdout.strip().split()[0]
            return ip if ip else None
        except:
            return None
