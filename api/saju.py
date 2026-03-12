from http.server import BaseHTTPRequestHandler
import json

try:
    from engine.calculator import calculate_engine_saju
except Exception as e:
    calculate_engine_saju = None
    IMPORT_ERROR = str(e)


class handler(BaseHTTPRequestHandler):

    def _send(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):

        if calculate_engine_saju is None:
            self._send(500, {"error": IMPORT_ERROR})
            return

        self._send(200, {"message": "saju api alive"})

    def do_POST(self):

        if calculate_engine_saju is None:
            self._send(500, {"error": IMPORT_ERROR})
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode()
            payload = json.loads(body)

            result = calculate_engine_saju(payload)

            self._send(200, result)

        except Exception as e:
            self._send(500, {"error": str(e)})
