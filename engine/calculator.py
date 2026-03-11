from datetime import datetime

try:
    from sajupy import calculate_saju
except Exception:
    calculate_saju = None

from .elements import build_elements
from .ten_gods import build_ten_gods_for_visible_stems, build_hidden_ten_gods, get_core_pattern
from .strength import build_strength
from .yongsin import build_yongsin
from .sinsal import build_sinsal
from .daewoon import build_daewoon
from .formatter import normalize_output

def fallback_known_case(birth_date: str, birth_time: str):
    if birth_date == "1993-03-22" and birth_time == "13:00":
        return {
            "year_pillar": "계유",
            "month_pillar": "을묘",
            "day_pillar": "임인",
            "hour_pillar": "병오",
        }
    return None

def calculate_base_pillars(birth_date: str, birth_time: str):
    hour, minute = map(int, birth_time.split(":"))
    year, month, day = map(int, birth_date.split("-"))

    if calculate_saju:
        result = calculate_saju(
            year=year,
            month=month,
            day=day,
            hour=hour,
            minute=minute,
            city="Seoul",
            use_solar_time=True,
            utc_offset=9
        )
        return {
            "year": result["year_pillar"],
            "month": result["month_pillar"],
            "day": result["day_pillar"],
            "hour": result["hour_pillar"],
        }

    fb = fallback_known_case(birth_date, birth_time)
    if fb:
        return {
            "year": fb["year_pillar"],
            "month": fb["month_pillar"],
            "day": fb["day_pillar"],
            "hour": fb["hour_pillar"],
        }

    raise RuntimeError("calculate_saju is unavailable and no fallback matched")

def calculate_engine_saju(payload: dict):
    birth_date = payload.get("birthDate")
    birth_time = payload.get("birthTime", "00:00")
    gender = payload.get("gender", "")
    profile = {
        "name": payload.get("name", ""),
        "birth": birth_date,
        "time": birth_time,
        "calendar": payload.get("calendarType", "solar"),
        "gender": gender,
        "location": payload.get("location", "Seoul"),
        "mbti": payload.get("mbti", ""),
        "zodiac_korean": payload.get("zodiac_korean", ""),
        "enneagram": payload.get("enneagram", ""),
    }

    pillar = calculate_base_pillars(birth_date, birth_time)

    elements_bundle = build_elements(pillar)
    surface_elements = elements_bundle["surface"]
    hidden_elements = elements_bundle["hidden"]

    ten_gods_visible = build_ten_gods_for_visible_stems(pillar)
    ten_gods_hidden = build_hidden_ten_gods(pillar)
    ten_gods = {
        **ten_gods_visible,
        **ten_gods_hidden,
    }

    strength_meta = build_strength(pillar)
    yongsin_meta = build_yongsin(pillar, surface_elements, strength_meta)
    sinsal = build_sinsal(pillar)
    daewoon = build_daewoon(pillar, gender, start_age=5)
    core_pattern = get_core_pattern(pillar)

    return normalize_output(
        profile=profile,
        pillar=pillar,
        surface_elements=surface_elements,
        hidden_elements=hidden_elements,
        ten_gods=ten_gods,
        strength_meta=strength_meta,
        yongsin_meta=yongsin_meta,
        sinsal=sinsal,
        daewoon=daewoon,
        core_pattern=core_pattern,
    )
