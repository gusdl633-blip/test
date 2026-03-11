from .constants import STEM_TO_ELEMENT, STEM_YINYANG, GENERATES, GENERATED_BY, CONTROLS, CONTROLLED_BY, BRANCH_HIDDEN_STEMS

def split_pillar(pillar: str):
    if not pillar or len(pillar) < 2:
        return "", ""
    return pillar[0], pillar[1]

def get_ten_god(day_master_stem: str, target_stem: str):
    if not day_master_stem or not target_stem:
        return ""

    dm_element = STEM_TO_ELEMENT[day_master_stem]
    dm_yinyang = STEM_YINYANG[day_master_stem]
    target_element = STEM_TO_ELEMENT[target_stem]
    target_yinyang = STEM_YINYANG[target_stem]

    same_polarity = dm_yinyang == target_yinyang

    # 같은 오행
    if dm_element == target_element:
        return "비견" if same_polarity else "겁재"

    # 내가 생하는 오행 -> 식상
    if GENERATES[dm_element] == target_element:
        return "식신" if same_polarity else "상관"

    # 내가 극하는 오행 -> 재성
    if CONTROLS[dm_element] == target_element:
        return "편재" if same_polarity else "정재"

    # 나를 극하는 오행 -> 관성
    if CONTROLLED_BY[dm_element] == target_element:
        return "편관" if same_polarity else "정관"

    # 나를 생하는 오행 -> 인성
    if GENERATED_BY[dm_element] == target_element:
        return "편인" if same_polarity else "정인"

    return ""

def build_ten_gods_for_visible_stems(pillar_dict: dict):
    day_stem, _ = split_pillar(pillar_dict["day"])

    return {
        "year_stem": get_ten_god(day_stem, split_pillar(pillar_dict["year"])[0]),
        "month_stem": get_ten_god(day_stem, split_pillar(pillar_dict["month"])[0]),
        "day_stem": "일간",
        "hour_stem": get_ten_god(day_stem, split_pillar(pillar_dict["hour"])[0]),
    }

def build_hidden_ten_gods(pillar_dict: dict):
    day_stem, _ = split_pillar(pillar_dict["day"])
    result = {}

    for key in ["year", "month", "day", "hour"]:
        _, branch = split_pillar(pillar_dict[key])
        hidden = BRANCH_HIDDEN_STEMS.get(branch, [])
        result[f"{key}_branch_hidden"] = [get_ten_god(day_stem, stem) for stem in hidden]

    return result

def get_core_pattern(pillar_dict: dict):
    day_stem, _ = split_pillar(pillar_dict["day"])
    _, month_branch = split_pillar(pillar_dict["month"])

    hidden = BRANCH_HIDDEN_STEMS.get(month_branch, [])
    if not hidden:
        return ""

    month_main_hidden = hidden[0]
    tg = get_ten_god(day_stem, month_main_hidden)

    mapping = {
        "비견": "건록격",
        "겁재": "양인격",
        "식신": "식신격",
        "상관": "상관격",
        "편재": "편재격",
        "정재": "정재격",
        "편관": "칠살격",
        "정관": "정관격",
        "편인": "편인격",
        "정인": "정인격",
    }
    return mapping.get(tg, "")
