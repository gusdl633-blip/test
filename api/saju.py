import json
from datetime import datetime
from sajupy import calculate_saju

def handler(request):

    if request.method != "POST":
        return {
            "statusCode": 405,
            "body": "Method Not Allowed"
        }

    try:
        data = json.loads(request.body)

        birth_date = data.get("birthDate")
        birth_time = data.get("birthTime", "00:00")

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

        return {
            "statusCode": 200,
            "body": json.dumps(result)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            })
        }
