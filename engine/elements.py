from .constants import STEM_TO_ELEMENT, BRANCH_TO_ELEMENT, BRANCH_HIDDEN_STEMS

def split_pillar(pillar: str):
    if not pillar or len(pillar) < 2:
        return "", ""
    return pillar[0], pillar[1]

def count_surface_elements(pillar_dict: dict):
    result = {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0}

    for key in ["year", "month", "day", "hour"]:
        pillar = pillar_dict.get(key, "")
        stem, branch = split_pillar(pillar)

        if stem in STEM_TO_ELEMENT:
            result[STEM_TO_ELEMENT[stem]] += 1
        if branch in BRANCH_TO_ELEMENT:
            result[BRANCH_TO_ELEMENT[branch]] += 1

    return result

def count_hidden_elements(pillar_dict: dict):
    result = {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0}

    for key in ["year", "month", "day", "hour"]:
        pillar = pillar_dict.get(key, "")
        _, branch = split_pillar(pillar)
        hidden = BRANCH_HIDDEN_STEMS.get(branch, [])
        for stem in hidden:
            result[STEM_TO_ELEMENT[stem]] += 1

    return result

def build_elements(pillar_dict: dict):
    return {
        "surface": count_surface_elements(pillar_dict),
        "hidden": count_hidden_elements(pillar_dict),
    }
