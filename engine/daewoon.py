from .constants import STEM_YINYANG, STEMS, BRANCHES
from .elements import split_pillar

def get_direction(year_stem: str, gender: str):
    # 양년남/음년녀 순행, 양년녀/음년남 역행
    yy = STEM_YINYANG[year_stem]
    is_male = gender.lower() in ["male", "man", "남성", "남자"]

    if (yy == "yang" and is_male) or (yy == "yin" and not is_male):
        return "순행"
    return "역행"

def next_ganzhi(stem: str, branch: str, step: int):
    s_idx = STEMS.index(stem)
    b_idx = BRANCHES.index(branch)
    return STEMS[(s_idx + step) % 10] + BRANCHES[(b_idx + step) % 12]

def prev_ganzhi(stem: str, branch: str, step: int):
    s_idx = STEMS.index(stem)
    b_idx = BRANCHES.index(branch)
    return STEMS[(s_idx - step) % 10] + BRANCHES[(b_idx - step) % 12]

def build_daewoon(pillar_dict: dict, gender: str, start_age: int = 5):
    year_stem, _ = split_pillar(pillar_dict["year"])
    month_stem, month_branch = split_pillar(pillar_dict["month"])

    direction = get_direction(year_stem, gender)

    cycles = []
    for i in range(1, 9):
        age = start_age + (i - 1) * 10
        if direction == "순행":
            pillar = next_ganzhi(month_stem, month_branch, i)
        else:
            pillar = prev_ganzhi(month_stem, month_branch, i)

        cycles.append({
            "age": age,
            "pillar": pillar,
        })

    return {
        "start_age": start_age,
        "direction": direction,
        "cycles": cycles,
    }
