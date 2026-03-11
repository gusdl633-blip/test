from .constants import STEM_TO_ELEMENT, GENERATED_BY
from .elements import split_pillar

def choose_useful_elements(day_master_element: str, strength: str):
    # 신강: 설기/재/관
    if strength == "신강":
        return [
            {
                "wood": "fire",
                "fire": "earth",
                "earth": "metal",
                "metal": "water",
                "water": "wood",
            }[day_master_element],
            {
                "wood": "earth",
                "fire": "metal",
                "earth": "water",
                "metal": "wood",
                "water": "fire",
            }[day_master_element],
            {
                "wood": "metal",
                "fire": "water",
                "earth": "wood",
                "metal": "fire",
                "water": "earth",
            }[day_master_element],
        ]

    # 신약/중화 약쪽: 비겁/인성 우선
    return [
        day_master_element,
        GENERATED_BY[day_master_element],
    ]

def choose_harmful_elements(day_master_element: str, strength: str):
    if strength == "신강":
        return [day_master_element, GENERATED_BY[day_master_element]]

    return [
        {
            "wood": "fire",
            "fire": "earth",
            "earth": "metal",
            "metal": "water",
            "water": "wood",
        }[day_master_element],
        {
            "wood": "earth",
            "fire": "metal",
            "earth": "water",
            "metal": "wood",
            "water": "fire",
        }[day_master_element],
    ]

def pick_best_element(candidates: list, surface_elements: dict):
    # 적게 있는 걸 우선 용신으로 잡음
    ranked = sorted(candidates, key=lambda x: surface_elements.get(x, 0))
    return ranked[0]

def element_to_kor(el: str):
    return {
        "wood": "목",
        "fire": "화",
        "earth": "토",
        "metal": "금",
        "water": "수",
    }[el]

def build_yongsin(pillar_dict: dict, surface_elements: dict, strength_meta: dict):
    day_stem, _ = split_pillar(pillar_dict["day"])
    dm_element = STEM_TO_ELEMENT[day_stem]
    strength = strength_meta["strength"]

    useful_candidates = choose_useful_elements(dm_element, strength)
    harmful_candidates = choose_harmful_elements(dm_element, strength)

    y = pick_best_element(useful_candidates, surface_elements)
    g = pick_best_element(harmful_candidates, surface_elements)

    reasons = []
    if strength == "신강":
        reasons.append("신강 구조라 설기·재성·관성 계열을 우선 본다")
    else:
        reasons.append("신약/중화 약측 구조라 비겁·인성 계열을 우선 본다")

    reasons.append(f"표면 오행 분포상 {element_to_kor(y)} 기운이 상대적으로 더 보완 가치가 크다")

    return {
        "yongsin": element_to_kor(y),
        "gisin": element_to_kor(g),
        "reason": reasons,
    }
