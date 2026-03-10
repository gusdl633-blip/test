from http.server import BaseHTTPRequestHandler
import json
from sajupy import calculate_saju

class handler(BaseHTTPRequestHandler):
    def do_POST(self):

        length = int(self.headers.get("Content-Length"))
        body = json.loads(self.rfile.read(length))

        birth_date = body["birthDate"]
        birth_time = body.get("birthTime", "00:00")

        year, month, day = map(int, birth_date.split("-"))
        hour, minute = map(int, birth_time.split(":"))

        saju = calculate_saju(
            year=year,
            month=month,
            day=day,
            hour=hour,
            minute=minute,
            city="Seoul",
            use_solar_time=True,
            utc_offset=9
        )

        result = {
            "pillar": {
                "year": saju["year_pillar"],
                "month": saju["month_pillar"],
                "day": saju["day_pillar"],
                "hour": saju["hour_pillar"]
            }
        }

        self.send_response(200)
        self.send_header("Content-Type","application/json")
        self.end_headers()

        self.wfile.write(json.dumps(result).encode())
