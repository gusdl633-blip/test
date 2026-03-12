from http.server import BaseHTTPRequestHandler
import json

try:
    from engine.calculator import calculate_engine_saju
except Exception as e:
    calculate_engine_saju = None
    IMPORT_ERROR = str(e)
else:
    IMPORT_ERROR = None


class handler(BaseHTTPRequestHandler):
    def _send(self, status_code: int, data: dict):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_GET(self):
        if calculate_engine_saju is None:
            self._send(500, {"error": IMPORT_ERROR or "calculator import failed"})
            return

        self._send(200, {"message": "saju api alive"})

    def do_POST(self):
        if calculate_engine_saju is None:
            self._send(500, {"error": IMPORT_ERROR or "calculator import failed"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length).decode("utf-8")
            payload = json.loads(raw_body) if raw_body else {}

            result = calculate_engine_saju(payload)
            self._send(200, result)

        except Exception as e:
            self._send(500, {"error": str(e)})
