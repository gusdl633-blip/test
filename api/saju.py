from http.server import BaseHTTPRequestHandler
import json
from sajupy import calculate_saju

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))

            birth_date = body["birthDate"]
            birth_time = body.get("birthTime", "00:00")
            location = body.get("location", "Seoul")

            year, month, day = map(int, birth_date.split("-"))
            hour, minute = map(int, birth_time.split(":"))

            saju = calculate_saju(
                year=year,
                month=month,
                day=day,
                hour=hour,
                minute=minute,
                city=location,
                use_solar_time=True,
                utc_offset=9,
            )

            result = {
                "pillar": {
                    "year": saju["year_pillar"],
                    "month": saju["month_pillar"],
                    "day": saju["day_pillar"],
                    "hour": saju["hour_pillar"],
                },
                "raw": saju,
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(
                json.dumps(
                    {"error": "saju calculation failed", "detail": str(e)},
                    ensure_ascii=False,
                ).encode("utf-8")
            )
