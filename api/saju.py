from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime
from sajupy import saju

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body)

            birth_date = data.get("birthDate")
            birth_time = data.get("birthTime", "00:00")

            dt = datetime.strptime(f"{birth_date} {birth_time}", "%Y-%m-%d %H:%M")

            result = saju(
                year=dt.year,
                month=dt.month,
                day=dt.day,
                hour=dt.hour
            )

            response = {
                "pillar": {
                    "year": result["year_pillar"],
                    "month": result["month_pillar"],
                    "day": result["day_pillar"],
                    "hour": result["hour_pillar"]
                },
                "raw": result
            }

            self.send_response(200)
            self.send_header('Content-type','application/json')
            self.end_headers()

            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type','application/json')
            self.end_headers()

            self.wfile.write(json.dumps({
                "error": str(e)
            }).encode())
