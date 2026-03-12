def calculate_engine_saju(payload: dict):
    if not isinstance(payload, dict):
        raise ValueError("payload must be dict")

    birth_date = payload.get("birthDate", "")
    birth_time = payload.get("birthTime", "00:00")
    gender = payload.get("gender", "")
    calendar_type = payload.get("calendarType", "solar")
    location = payload.get("location", "Seoul")

    return {
        "profile": {
            "name": payload.get("name", ""),
            "birth": birth_date,
            "time": birth_time,
            "calendar": calendar_type,
            "gender": gender,
            "location": location,
            "mbti": payload.get("mbti", ""),
            "zodiac_korean": payload.get("zodiac_korean", ""),
            "enneagram": payload.get("enneagram", ""),
            "ilgan": "임수",
            "ilgan_display": "임수 일간",
        },
        "pillar": {
            "year": "계유",
            "month": "을묘",
            "day": "임인",
            "hour": "병오",
        },
        "elements": {
            "wood": 3,
            "fire": 2,
            "earth": 0,
            "metal": 1,
            "water": 2,
        },
        "badges": {
            "ilgan": "임수",
            "strength": "신약",
            "yongsin": "금",
            "gisin": "화",
            "core_pattern": "편인격",
        },
        "sinsal": ["년살", "장성살", "역마살", "문창귀인"],
        "daewoon": [],
    }
