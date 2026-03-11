from .constants import STEM_TO_ELEMENT, ELEMENT_KOR
from .elements import split_pillar

def build_ilgan_display(day_pillar: str):
    stem, _ = split_pillar(day_pillar)
    stem_kor = {
        "갑": "갑목", "을": "을목",
        "병": "병화", "정": "정화",
        "무": "무토", "기": "기토",
        "경": "경금", "신": "신금",
        "임": "임수", "계": "계수",
    }
    return stem_kor.get(stem, stem)

def normalize_output(
    profile: dict,
    pillar: dict,
    surface_elements: dict,
    hidden_elements: dict,
    ten_gods: dict,
    strength_meta: dict,
    yongsin_meta: dict,
    sinsal: list,
    daewoon: dict,
    core_pattern: str,
):
    day_stem, _ = split_pillar(pillar["day"])
    ilgan_display = build_ilgan_display(pillar["day"])

    return {
        "profile": {
            "name": profile.get("name", ""),
            "birth": profile.get("birth", ""),
            "time": profile.get("time", ""),
            "calendar": profile.get("calendar", "solar"),
            "gender": profile.get("gender", ""),
            "location": profile.get("location", ""),
            "ilgan": ilgan_display,
            "ilgan_display": f"{ilgan_display} 일간",
            "mbti": profile.get("mbti", ""),
            "zodiac_korean": profile.get("zodiac_korean", ""),
            "enneagram": profile.get("enneagram", ""),
        },
        "pillar": pillar,
        "elements": surface_elements,
        "elements_hidden": hidden_elements,
        "badges": {
            "ilgan": ilgan_display,
            "strength": strength_meta["strength"],
            "yongsin": yongsin_meta["yongsin"],
            "gisin": yongsin_meta["gisin"],
            "core_pattern": core_pattern,
        },
        "ten_gods": ten_gods,
        "sinsal": sinsal,
        "strength_meta": strength_meta,
        "yongsin_meta": yongsin_meta,
        "daewoon": daewoon,
    }
