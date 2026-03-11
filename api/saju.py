import json
from engine.calculator import calculate_engine_saju

def handler(request):
    if request.method != "POST":
        return {
            "statusCode": 405,
            "body": json.dumps({"error": "Method Not Allowed"}, ensure_ascii=False),
            "headers": {
                "Content-Type": "application/json; charset=utf-8"
            }
        }

    try:
        body = json.loads(request.body)
        result = calculate_engine_saju(body)

        return {
            "statusCode": 200,
            "body": json.dumps(result, ensure_ascii=False),
            "headers": {
                "Content-Type": "application/json; charset=utf-8"
            }
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}, ensure_ascii=False),
            "headers": {
                "Content-Type": "application/json; charset=utf-8"
            }
        }
