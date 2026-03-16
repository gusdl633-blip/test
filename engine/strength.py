from .constants import STEM_TO_ELEMENT, GENERATED_BY, SEASON_SUPPORT, BRANCH_HIDDEN_STEMS, STEM_YINYANG
from .elements import split_pillar

def supportive_elements(day_master_element: str):
    return {day_master_element, GENERATED_BY[day_master_element]}

def draining_elements(day_master_element: str):
    child = {
        "wood": "fire",
        "fire": "earth",
        "earth": "metal",
        "metal": "water",
        "water": "wood",
    }[day_master_element]

    wealth = {
        "wood": "earth",
        "fire": "metal",
        "earth": "water",
        "metal": "wood",
        "water": "fire",
    }[day_master_element]

    officer = {
        "wood": "metal",
        "fire": "water",
        "earth": "wood",
        "metal": "fire",
        "water": "earth",
    }[day_master_element]

    return {child, wealth, officer}

def score_month_branch(day_master_element: str, month_branch: str):
    rule = SEASON_SUPPORT[day_master_element]
    if month_branch in rule["strong"]:
        return 25, f"월지 {month_branch}가 일간을 계절적으로 강하게 받쳐준다"
    if month_branch in rule["medium"]:
        return 12, f"월지 {month_branch}가 일간에 중간 정도 힘을 준다"
    return -10, f"월지 {month_branch}가 일간을 계절적으로 약하게 만든다"

def score_visible_stems(pillar_dict: dict, day_master_element: str):
    score = 0
    basis = []

    support = supportive_elements(day_master_element)
    drain = draining_elements(day_master_element)

    for key in ["year", "month", "hour"]:
        stem, _ = split_pillar(pillar_dict[key])
        if not stem:
            continue

        el = STEM_TO_ELEMENT[stem]

        if el in support:
            score += 10
            basis.append(f"{key} 천간 {stem}이 일간을 돕는다")
        elif el in drain:
            score -= 8
            basis.append(f"{key} 천간 {stem}이 일간 기운을 뺀다")

    return score, basis

def score_hidden_stems(pillar_dict: dict, day_master_element: str):
    score = 0
    basis = []

    support = supportive_elements(day_master_element)
    drain = draining_elements(day_master_element)

    weights = [6, 3, 2]

    for key in ["year", "month", "day", "hour"]:
        _, branch = split_pillar(pillar_dict[key])
        hidden = BRANCH_HIDDEN_STEMS.get(branch, [])

        for idx, stem in enumerate(hidden):
            el = STEM_TO_ELEMENT[stem]
            weight = weights[idx] if idx < len(weights) else 1

            if el in support:
                score += weight
            elif el in drain:
                score -= weight

        if hidden:
            basis.append(f"{key} 지지 {branch} 지장간 {hidden} 반영")

    return score, basis

def classify_strength(score: int):
    if score >= 40:
        return "신강"
    if score >= 18:
        return "중화"
    return "신약"

def build_strength(pillar_dict: dict):
    day_stem, _ = split_pillar(pillar_dict["day"])
    _, month_branch = split_pillar(pillar_dict["month"])
    dm_element = STEM_TO_ELEMENT[day_stem]

    total = 0
    basis = []

    s1, b1 = score_month_branch(dm_element, month_branch)
    total += s1
    basis.append(b1)

    s2, b2 = score_visible_stems(pillar_dict, dm_element)
    total += s2
    basis.extend(b2)

    s3, b3 = score_hidden_stems(pillar_dict, dm_element)
    total += s3
    basis.extend(b3)

    return {
        "score": total,
        "strength": classify_strength(total),
        "basis": basis[:6],
    }
