import sys
import os
from http.server import BaseHTTPRequestHandler
import json

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from engine.calculator import calculate_engine_saju

class handler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: dict):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_GET(self):
        self._send_json(200, {"ok": True, "message": "import success"})

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length).decode("utf-8")
            body = json.loads(raw_body) if raw_body else {}

            result = calculate_engine_saju(body)
            self._send_json(200, result)

        except Exception as e:
            self._send_json(500, {"error": str(e)})
