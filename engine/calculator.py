try:
    from sajupy import calculate_saju
except Exception as e:
    calculate_saju = None
    SAJUPY_IMPORT_ERROR = str(e)
else:
    SAJUPY_IMPORT_ERROR = None


STEM_ELEMENT = {
    "갑": "wood", "을": "wood",
    "병": "fire", "정": "fire",
    "무": "earth", "기": "earth",
    "경": "metal", "신": "metal",
    "임": "water", "계": "water",
}

BRANCH_ELEMENT = {
    "인": "wood", "묘": "wood",
    "사": "fire", "오": "fire",
    "진": "earth", "술": "earth", "축": "earth", "미": "earth",
    "신": "metal", "유": "metal",
    "해": "water", "자": "water",
}

HIDDEN_STEMS = {
    "자": ["계"],
    "축": ["기", "계", "신"],
    "인": ["갑", "병", "무"],
    "묘": ["을"],
    "진": ["무", "을", "계"],
    "사": ["병", "무", "경"],
    "오": ["정", "기"],
    "미": ["기", "정", "을"],
    "신": ["경", "임", "무"],
    "유": ["신"],
    "술": ["무", "신", "정"],
    "해": ["임", "갑"],
}

STEM_YINYANG = {
    "갑": "yang", "병": "yang", "무": "yang", "경": "yang", "임": "yang",
    "을": "yin", "정": "yin", "기": "yin", "신": "yin", "계": "yin",
}

ELEMENT_GENERATES = {
    "wood": "fire",
    "fire": "earth",
    "earth": "metal",
    "metal": "water",
    "water": "wood",
}

ELEMENT_CONTROLS = {
    "wood": "earth",
    "fire": "metal",
    "earth": "water",
    "metal": "wood",
    "water": "fire",
}

KOR_ELEMENT_LABEL = {
    "wood": "목",
    "fire": "화",
    "earth": "토",
    "metal": "금",
    "water": "수",
}

KOR_STEM_LABEL = {
    "갑": "갑목", "을": "을목",
    "병": "병화", "정": "정화",
    "무": "무토", "기": "기토",
    "경": "경금", "신": "신금",
    "임": "임수", "계": "계수",
}

DAYMASTER_STRENGTH_MONTH_SUPPORT = {
    "wood": {"인", "묘", "해", "자"},
    "fire": {"사", "오", "인", "묘"},
    "earth": {"진", "술", "축", "미", "사", "오"},
    "metal": {"신", "유", "술", "축"},
    "water": {"해", "자", "신", "유"},
}

SIMPLE_SINSAL = {
    "문창귀인": {"갑": ["사"], "을": ["오"], "병": ["신"], "정": ["유"], "무": ["신"], "기": ["유"], "경": ["해"], "신": ["자"], "임": ["인"], "계": ["묘"]},
    "역마살": {"인": ["신"], "오": ["신"], "술": ["신"], "신": ["인"], "자": ["인"], "진": ["인"], "사": ["해"], "유": ["해"], "축": ["해"], "해": ["사"], "묘": ["사"], "미": ["사"]},
    "장성살": {"인": ["묘"], "오": ["오"], "술": ["유"], "신": ["유"], "자": ["자"], "진": ["묘"], "사": ["오"], "유": ["유"], "축": ["자"], "해": ["자"], "묘": ["묘"], "미": ["오"]},
    "년살": {"인": ["축"], "오": ["사"], "술": ["유"], "신": ["미"], "자": ["해"], "진": ["묘"], "사": ["진"], "유": ["신"], "축": ["자"], "해": ["술"], "묘": ["인"], "미": ["오"]},
}

def normalize_time(value):
    if not value or not isinstance(value, str):
        return "00:00"
    value = value.strip()
    if ":" not in value:
        return "00:00"
    hh, mm = value.split(":", 1)
    try:
        hh = max(0, min(23, int(hh)))
        mm = max(0, min(59, int(mm)))
        return f"{hh:02d}:{mm:02d}"
    except Exception:
        return "00:00"

def split_pillar(pillar: str):
    if not pillar or len(pillar) < 2:
        raise ValueError(f"invalid pillar: {pillar}")
    return pillar[0], pillar[1]

def get_element_of_stem(stem: str):
    return STEM_ELEMENT[stem]

def get_relation(day_element: str, other_element: str):
    if day_element == other_element:
        return "same"

    if ELEMENT_GENERATES[day_element] == other_element:
        return "output"

    if ELEMENT_GENERATES[other_element] == day_element:
        return "resource"

    if ELEMENT_CONTROLS[day_element] == other_element:
        return "wealth"

    if ELEMENT_CONTROLS[other_element] == day_element:
        return "officer"

    return "unknown"

def ten_god(day_stem: str, target_stem: str):
    day_element = STEM_ELEMENT[day_stem]
    target_element = STEM_ELEMENT[target_stem]
    rel = get_relation(day_element, target_element)

    same_polarity = STEM_YINYANG[day_stem] == STEM_YINYANG[target_stem]

    if rel == "same":
        return "비견" if same_polarity else "겁재"
    if rel == "output":
        return "식신" if same_polarity else "상관"
    if rel == "wealth":
        return "편재" if same_polarity else "정재"
    if rel == "officer":
        return "편관" if same_polarity else "정관"
    if rel == "resource":
        return "편인" if same_polarity else "정인"
    return ""

def build_elements(pillar):
    result = {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0}

    for value in pillar.values():
        stem, branch = split_pillar(value)
        result[STEM_ELEMENT[stem]] += 1
        result[BRANCH_ELEMENT[branch]] += 1

    return result

def build_hidden_elements_and_tengods(pillar):
    hidden_elements = {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0}
    hidden_tengods = {}
    day_stem, _ = split_pillar(pillar["day"])

    for key, value in pillar.items():
        _, branch = split_pillar(value)
        stems = HIDDEN_STEMS.get(branch, [])
        hidden_tengods[key] = []
        for stem in stems:
            hidden_elements[STEM_ELEMENT[stem]] += 1
            hidden_tengods[key].append({
                "stem": stem,
                "ten_god": ten_god(day_stem, stem)
            })

    return hidden_elements, hidden_tengods

def build_visible_tengods(pillar):
    day_stem, _ = split_pillar(pillar["day"])
    visible = {}

    for key, value in pillar.items():
        stem, _ = split_pillar(value)
        visible[key] = {
            "stem": stem,
            "ten_god": ten_god(day_stem, stem) if key != "day" else "일간"
        }

    return visible

def judge_strength(pillar, elements):
    day_stem, _ = split_pillar(pillar["day"])
    _, month_branch = split_pillar(pillar["month"])
    day_element = STEM_ELEMENT[day_stem]

    score = 0

    if month_branch in DAYMASTER_STRENGTH_MONTH_SUPPORT[day_element]:
        score += 2

    same_count = elements[day_element]

    # 생조 오행
    resource_element = None
    for k, v in ELEMENT_GENERATES.items():
        if v == day_element:
            resource_element = k
            break

    score += same_count
    score += elements[resource_element]

    if score >= 5:
        return "신강"
    if score <= 2:
        return "신약"
    return "중화"

def judge_yongsin(day_stem, strength):
    day_element = STEM_ELEMENT[day_stem]

    if strength == "신강":
        # 설기/극제 우선
        output = ELEMENT_GENERATES[day_element]
        wealth = ELEMENT_CONTROLS[day_element]
        return output, wealth

    if strength == "신약":
        # 비겁/인성 우선
        same = day_element
        resource = None
        for k, v in ELEMENT_GENERATES.items():
            if v == day_element:
                resource = k
                break
        return resource, same

    # 중화면 인성/설기 절충
    output = ELEMENT_GENERATES[day_element]
    resource = None
    for k, v in ELEMENT_GENERATES.items():
        if v == day_element:
            resource = k
            break
    return resource, output

def build_sinsal(pillar):
    day_stem, day_branch = split_pillar(pillar["day"])
    found = set()

    branches = [split_pillar(v)[1] for v in pillar.values()]

    for name, rule in SIMPLE_SINSAL.items():
        if name == "문창귀인":
            targets = rule.get(day_stem, [])
            for b in branches:
                if b in targets:
                    found.add(name)
        else:
            targets = rule.get(day_branch, [])
            for b in branches:
                if b in targets:
                    found.add(name)

    return list(found)

def next_ganzhi(pillar_str, steps):
    stems = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
    branches = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]

    stem, branch = split_pillar(pillar_str)
    s_idx = stems.index(stem)
    b_idx = branches.index(branch)

    s_new = stems[(s_idx + steps) % 10]
    b_new = branches[(b_idx + steps) % 12]
    return s_new + b_new

def build_daewoon(month_pillar, gender, year_stem):
    # 정확한 시작 나이는 입절 계산이 필요해서 여기선 5세 고정
    # 순행/역행만 반영
    is_year_yang = STEM_YINYANG[year_stem] == "yang"
    is_male = gender == "male" or gender == "남성" or gender == "남자"

    forward = (is_male and is_year_yang) or ((not is_male) and (not is_year_yang))
    step_sign = 1 if forward else -1

    result = []
    age = 5
    for i in range(1, 9):
        p = next_ganzhi(month_pillar, step_sign * i)
        result.append({
            "age_start": age,
            "age_end": age + 9,
            "pillar": p
        })
        age += 10
    return result

def calculate_base_pillars(birth_date: str, birth_time: str):
    if calculate_saju is None:
        raise RuntimeError(f"sajupy import failed: {SAJUPY_IMPORT_ERROR}")

    birth_time = normalize_time(birth_time)
    year, month, day = map(int, birth_date.split("-"))
    hour, minute = map(int, birth_time.split(":"))

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

def calculate_engine_saju(payload: dict):
    if not isinstance(payload, dict):
        raise ValueError("payload must be dict")

    birth_date = payload.get("birthDate")
    if not birth_date:
        raise ValueError("birthDate missing")

    birth_time = normalize_time(payload.get("birthTime", "00:00"))
    gender = payload.get("gender", "")
    calendar = payload.get("calendarType", "solar")
    location = payload.get("location", "Seoul")

    pillar = calculate_base_pillars(birth_date, birth_time)

    elements = build_elements(pillar)
    hidden_elements, hidden_tengods = build_hidden_elements_and_tengods(pillar)
    visible_tengods = build_visible_tengods(pillar)

    day_stem, _ = split_pillar(pillar["day"])
    year_stem, _ = split_pillar(pillar["year"])

    strength = judge_strength(pillar, elements)
    yongsin, gisin = judge_yongsin(day_stem, strength)
    sinsal = build_sinsal(pillar)
    daewoon = build_daewoon(pillar["month"], gender, year_stem)

    # 핵심격은 월지 장간 기준으로 단순화
    month_hidden = hidden_tengods["month"][0]["ten_god"] if hidden_tengods["month"] else ""
    core_pattern = month_hidden or "보통격"

    return {
        "profile": {
            "name": payload.get("name", ""),
            "birth": birth_date,
            "time": birth_time,
            "calendar": calendar,
            "gender": gender,
            "location": location,
            "mbti": payload.get("mbti", ""),
            "zodiac_korean": payload.get("zodiac_korean", ""),
            "enneagram": payload.get("enneagram", ""),
            "ilgan": KOR_STEM_LABEL.get(day_stem, day_stem),
            "ilgan_display": f"{KOR_STEM_LABEL.get(day_stem, day_stem)} 일간",
        },
        "pillar": pillar,
        "elements": elements,
        "hidden_elements": hidden_elements,
        "visible_ten_gods": visible_tengods,
        "hidden_ten_gods": hidden_tengods,
        "badges": {
            "ilgan": KOR_STEM_LABEL.get(day_stem, day_stem),
            "strength": strength,
            "yongsin": KOR_ELEMENT_LABEL.get(yongsin, yongsin),
            "gisin": KOR_ELEMENT_LABEL.get(gisin, gisin),
            "core_pattern": core_pattern,
        },
        "sinsal": sinsal,
        "daewoon": daewoon,
    }
