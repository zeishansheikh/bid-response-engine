def compute_budget_alignment_score(rfp_budget: float, sector: str, capability_library: list[dict]) -> float:
    similar = [float(c["contract_value"]) for c in capability_library if c.get("sector") == sector and c.get("contract_value") is not None]
    if not similar: 
        return 0.5
    avg = sum(similar) / len(similar)
    if avg == 0 or rfp_budget == 0:
        return 0.0
    return min(rfp_budget, avg) / max(rfp_budget, avg)

def compute_past_sector_win_rate(sector: str, historical_bids: list[dict]) -> float:
    sector_bids = [b for b in historical_bids if b.get("sector") == sector]
    if not sector_bids: 
        return 0.5
    return sum(1 for b in sector_bids if b.get("won")) / len(sector_bids)

def compute_compliance_pass_rate(checklist: list[dict]) -> float:
    if not checklist: 
        return 0.0
    matched = sum(1 for c in checklist if c.get("match_status") == "matched")
    partial = sum(1 for c in checklist if c.get("match_status") == "partial")
    return (matched + 0.5 * partial) / len(checklist)

def compute_competitor_score(competitor_count: int) -> float:
    if competitor_count <= 2: 
        return 1.0
    if competitor_count <= 5: 
        return 0.6
    if competitor_count <= 10: 
        return 0.3
    return 0.1

WEIGHTS = {"budget_alignment": 0.25, "past_win_rate": 0.30, "compliance_pass_rate": 0.30, "competitor": 0.15}

def compute_win_probability(budget_alignment: float, past_win_rate: float, compliance_pass_rate: float, competitor_score: float) -> float:
    return (WEIGHTS["budget_alignment"] * budget_alignment + 
            WEIGHTS["past_win_rate"] * past_win_rate + 
            WEIGHTS["compliance_pass_rate"] * compliance_pass_rate + 
            WEIGHTS["competitor"] * competitor_score)

def decide(win_probability: float, checklist: list[dict]) -> tuple[str, str]:
    critical_gaps = [
        c for c in checklist 
        if c.get("match_status") == "gap"
        and c.get("category") in ("legal", "certification") 
        and not c.get("manager_override", False)
    ]
    if win_probability >= 0.6 and not critical_gaps: 
        decision = "GO"
    elif win_probability < 0.35 or critical_gaps: 
        decision = "NO-GO"
    else: 
        decision = "CONDITIONAL"
    rationale = f"Win probability {win_probability:.0%}. {len(critical_gaps)} unresolved legal/certification gap(s)."
    return decision, rationale
