"""
Configuration loader for SmartSense Sensor Node
"""

import yaml
from pathlib import Path
from typing import Dict, Any


def load_config(config_path: str = "config.yaml") -> Dict[str, Any]:
    """
    Load configuration from YAML file

    Args:
        config_path: Path to configuration file

    Returns:
        Configuration dictionary

    Raises:
        FileNotFoundError: If config file doesn't exist
        yaml.YAMLError: If config file is invalid
    """
    config_file = Path(config_path)

    if not config_file.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")

    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)

        # Validate required sections
        required_sections = ['node', 'mqtt', 'sensors']
        for section in required_sections:
            if section not in config:
                raise ValueError(f"Missing required section: {section}")

        return config

    except yaml.YAMLError as e:
        raise yaml.YAMLError(f"Invalid YAML configuration: {e}")


def get_sensor_config(config: Dict[str, Any], sensor_name: str) -> Dict[str, Any]:
    """
    Get configuration for a specific sensor

    Args:
        config: Main configuration dictionary
        sensor_name: Sensor name (e.g., 'bme680', 'scd40')

    Returns:
        Sensor configuration dictionary or None if disabled
    """
    sensor_config = config.get('sensors', {}).get(sensor_name, {})

    if not sensor_config.get('enabled', False):
        return None

    return sensor_config


def get_mqtt_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get MQTT configuration

    Args:
        config: Main configuration dictionary

    Returns:
        MQTT configuration dictionary
    """
    return config.get('mqtt', {})


def get_node_info(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get node information

    Args:
        config: Main configuration dictionary

    Returns:
        Node information dictionary
    """
    return config.get('node', {})
