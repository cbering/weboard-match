"""Scoring algorithm: matches members to a company based on phase competencies."""

PHASES = {
    "eksistens":   ["ivaerksaetter", "salg", "oekonomi", "finansiering"],
    "overlevelse": ["salg", "oekonomi", "finansiering"],
    "succes":      ["strategi", "hr", "digitalisering", "finansiering"],
    "takeoff":     ["salg", "digitalisering", "eksport"],
    "modenhed":    ["innovation", "digitalisering", "strategi"],
}

PERSONLIGE = ["aktiv_lytning", "empatisk", "holistisk", "nysgerrig", "udfordrer"]


def score_member(member, company) -> dict:
    phase_comps = PHASES.get(company.phase, [])
    desired = company.desired or []
    rel_ids = list(dict.fromkeys(phase_comps + desired))  # deduplicate, preserve order

    ratings = member.ratings or {}
    score = 0
    matched = []

    for cid in rel_ids:
        val = ratings.get(cid, 0)
        if val > 0:
            matched.append({"id": cid, "val": val})
        score += val * 2

    # personal competency bonus (average)
    pers_vals = [ratings.get(p, 0) for p in PERSONLIGE]
    pers_avg = sum(pers_vals) / len(PERSONLIGE) if PERSONLIGE else 0
    score += pers_avg

    # industry match bonus
    industry_match = False
    if company.branche and member.branche:
        co_words = [w for w in company.branche.lower().split() if len(w) > 3]
        if any(w in member.branche.lower() for w in co_words):
            industry_match = True
            score += 3

    max_possible = len(rel_ids) * 6 + 3 + 3
    pct = min(100, round(score / max_possible * 100)) if max_possible else 0

    return {
        "score": round(score, 1),
        "pct": pct,
        "matched_competencies": matched,
        "industry_match": industry_match,
        "relevant_competencies": rel_ids,
    }
