from .constants import (
    MUNCHANG_BY_DAY_STEM,
    CHEONEUL_BY_DAY_STEM,
    DOHWA_GROUP,
    YEOKMA_GROUP,
    JANGSEONG_GROUP,
    NYEONSAL_GROUP,
    JAESAL_GROUP,
    HYEONCHIM_CHARS,
)
from .elements import split_pillar

def group_lookup(group_map: dict, base_branch: str):
    for keys, value in group_map.items():
        if base_branch in keys:
            return value
    return None

def contains_branch(pillar_dict: dict, branch_target: str):
    for key in ["year", "month", "day", "hour"]:
        _, br = split_pillar(pillar_dict[key])
        if br == branch_target:
            return True
    return False

def build_sinsal(pillar_dict: dict):
    result = []

    day_stem, day_branch = split_pillar(pillar_dict["day"])
    year_stem, year_branch = split_pillar(pillar_dict["year"])

    # 문창귀인
    mc = MUNCHANG_BY_DAY_STEM.get(day_stem)
    if mc and contains_branch(pillar_dict, mc):
        result.append("문창귀인")

    # 천을귀인
    ce = CHEONEUL_BY_DAY_STEM.get(day_stem, [])
    if any(contains_branch(pillar_dict, x) for x in ce):
        result.append("천을귀인")

    # 도화
    dohwa = group_lookup(DOHWA_GROUP, day_branch)
    if dohwa and contains_branch(pillar_dict, dohwa):
        result.append("도화살")

    # 역마
    yeokma = group_lookup(YEOKMA_GROUP, day_branch)
    if yeokma and contains_branch(pillar_dict, yeokma):
        result.append("역마살")

    # 장성살
    js = group_lookup(JANGSEONG_GROUP, day_branch)
    if js and contains_branch(pillar_dict, js):
        result.append("장성살")

    # 년살
    ns = group_lookup(NYEONSAL_GROUP, year_branch)
    if ns and contains_branch(pillar_dict, ns):
        result.append("년살")

    # 재살
    zs = group_lookup(JAESAL_GROUP, year_branch)
    if zs and contains_branch(pillar_dict, zs):
        result.append("재살")

    # 현침살 간단 버전
    all_chars = "".join([pillar_dict[k] for k in ["year", "month", "day", "hour"] if pillar_dict.get(k)])
    if any(ch in all_chars for ch in HYEONCHIM_CHARS):
        result.append("현침살")

    # 중복 제거
    return list(dict.fromkeys(result))
