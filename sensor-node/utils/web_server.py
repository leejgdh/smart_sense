"""
Simple web server for WiFi provisioning
"""

import logging
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import json
from typing import Callable

logger = logging.getLogger("smartsense.webserver")


class ProvisioningHandler(BaseHTTPRequestHandler):
    """HTTP request handler for provisioning page"""

    wifi_callback: Callable = None

    def log_message(self, format, *args):
        """Override to use our logger"""
        logger.debug(format % args)

    def do_GET(self):
        """Handle GET requests"""
        if self.path == "/" or self.path == "/index.html":
            self.serve_index()
        elif self.path == "/style.css":
            self.serve_css()
        elif self.path == "/scan":
            self.serve_scan()
        else:
            self.send_error(404)

    def do_POST(self):
        """Handle POST requests"""
        if self.path == "/connect":
            self.handle_connect()
        else:
            self.send_error(404)

    def serve_index(self):
        """Serve main configuration page"""
        html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartSense Setup</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div class="container">
        <h1>SmartSense WiFi Setup</h1>
        <p>Connect your sensor node to WiFi</p>

        <form id="wifiForm" onsubmit="connectWiFi(event)">
            <div class="form-group">
                <label for="ssid">WiFi Network:</label>
                <input type="text" id="ssid" name="ssid" required
                       placeholder="Enter WiFi SSID">
            </div>

            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required
                       placeholder="Enter WiFi password">
            </div>

            <button type="submit" id="connectBtn">Connect</button>
        </form>

        <div id="status" class="status"></div>
    </div>

    <script>
        function connectWiFi(e) {
            e.preventDefault();

            const btn = document.getElementById('connectBtn');
            const status = document.getElementById('status');

            btn.disabled = true;
            btn.textContent = 'Connecting...';
            status.textContent = 'Connecting to WiFi...';
            status.className = 'status info';

            const formData = new FormData(e.target);
            const data = {
                ssid: formData.get('ssid'),
                password: formData.get('password')
            };

            fetch('/connect', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    status.textContent = 'Connected successfully! You can close this page.';
                    status.className = 'status success';
                } else {
                    status.textContent = 'Connection failed: ' + data.error;
                    status.className = 'status error';
                    btn.disabled = false;
                    btn.textContent = 'Connect';
                }
            })
            .catch(error => {
                status.textContent = 'Error: ' + error;
                status.className = 'status error';
                btn.disabled = false;
                btn.textContent = 'Connect';
            });
        }
    </script>
</body>
</html>
"""
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(html.encode())

    def serve_css(self):
        """Serve CSS stylesheet"""
        css = """
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 20px;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.container {
    background: white;
    border-radius: 12px;
    padding: 40px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

h1 {
    color: #667eea;
    margin: 0 0 10px 0;
    font-size: 28px;
}

p {
    color: #666;
    margin: 0 0 30px 0;
}

.form-group {
    margin-bottom: 20px;
}

label {
    display: block;
    color: #333;
    font-weight: 500;
    margin-bottom: 8px;
}

input {
    width: 100%;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    box-sizing: border-box;
    transition: border-color 0.3s;
}

input:focus {
    outline: none;
    border-color: #667eea;
}

button {
    width: 100%;
    padding: 14px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s;
}

button:hover:not(:disabled) {
    background: #5568d3;
}

button:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.status {
    margin-top: 20px;
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    display: none;
}

.status.info {
    background: #e3f2fd;
    color: #1976d2;
    display: block;
}

.status.success {
    background: #e8f5e9;
    color: #388e3c;
    display: block;
}

.status.error {
    background: #ffebee;
    color: #d32f2f;
    display: block;
}
"""
        self.send_response(200)
        self.send_header("Content-type", "text/css")
        self.end_headers()
        self.wfile.write(css.encode())

    def serve_scan(self):
        """Serve WiFi scan results (placeholder)"""
        networks = []
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(networks).encode())

    def handle_connect(self):
        """Handle WiFi connection request"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode())

            ssid = data.get('ssid')
            password = data.get('password')

            if not ssid or not password:
                raise ValueError("SSID and password required")

            # Call WiFi callback
            if self.wifi_callback:
                success = self.wifi_callback(ssid, password)
            else:
                success = False

            response = {
                'success': success,
                'error': None if success else 'Connection failed'
            }

        except Exception as e:
            logger.error(f"Connect error: {e}")
            response = {
                'success': False,
                'error': str(e)
            }

        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())


class ProvisioningServer:
    """Simple HTTP server for WiFi provisioning"""

    def __init__(self, port: int = 80):
        self.port = port
        self.server: Optional[HTTPServer] = None

    def start(self, wifi_callback: Callable):
        """Start provisioning server"""
        try:
            ProvisioningHandler.wifi_callback = wifi_callback
            self.server = HTTPServer(('0.0.0.0', self.port), ProvisioningHandler)
            logger.info(f"Provisioning server started on port {self.port}")
            self.server.serve_forever()
        except Exception as e:
            logger.error(f"Failed to start server: {e}")

    def stop(self):
        """Stop provisioning server"""
        if self.server:
            self.server.shutdown()
            logger.info("Provisioning server stopped")
