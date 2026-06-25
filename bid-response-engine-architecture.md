# AI-Powered Bid & Proposal Response Engine — Build Spec

Build Section 11 in order, one service at a time.

---

## 1. Stack

- Frontend: Next.js 14, App Router, TypeScript, Tailwind, shadcn/ui, recharts
- Backend: FastAPI, Python 3.11, Pydantic v2
- DB: Supabase Postgres + `pgvector`
- LLM: Claude API, model `claude-sonnet-4-6`, `anthropic` SDK
- Embeddings: `sentence-transformers`, `all-MiniLM-L6-v2`, 384 dims, local
- Parsing: `pdfplumber` (PDF), `python-docx` (DOCX)
- Scoring: weighted formula (Section 6), upgrade to `LogisticRegression` once `historical_bids` has real rows
- Export: `python-docx`

---

## 2. Database Schema

```sql
create extension if not exists vector;

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null, sector text not null,
  status text not null default 'draft',
  created_at timestamp default now()
);

create table rfp_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  file_path text not null, raw_text text not null,
  uploaded_at timestamp default now()
);

create table requirements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  requirement_text text not null,
  category text not null, -- technical|financial|legal|experience|certification|other
  source_page int
);

create table evaluation_criteria (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  criterion_name text not null, weight_pct numeric not null
);

create table qa_sections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  question_text text not null, section_order int not null
);

create table capability_library (
  id uuid primary key default gen_random_uuid(),
  project_title text not null, sector text not null, certification text,
  year_completed int, contract_value numeric, duration_months int,
  client_type text, summary_text text not null
);

create table capability_embeddings (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid references capability_library(id) on delete cascade,
  chunk_text text not null, embedding vector(384) not null
);
create index on capability_embeddings using ivfflat (embedding vector_cosine_ops);

create table compliance_checklist (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  requirement_id uuid references requirements(id) on delete cascade,
  match_status text not null, -- matched|partial|gap
  confidence_score numeric not null,
  evidence_capability_id uuid references capability_library(id),
  manager_override boolean default false
);

create table draft_sections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  qa_section_id uuid references qa_sections(id) on delete cascade,
  draft_text text, edited_text text, approved boolean default false
);

create table historical_bids (
  id uuid primary key default gen_random_uuid(),
  sector text not null, budget_range numeric, competitor_count int,
  eval_score numeric, won boolean not null
  -- add remaining cols once you see the real 18-col sheet
);

create table bid_scores (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  win_probability numeric not null, budget_alignment_score numeric not null,
  past_win_rate_score numeric not null, compliance_pass_rate numeric not null,
  competitor_score numeric not null,
  go_no_go text not null, rationale text not null
);
```

---

## 3. Extraction — `services/extraction_service.py`

```python
import anthropic, json
client = anthropic.Anthropic()

EXTRACTION_SYSTEM_PROMPT = """You are a senior bid compliance analyst. You will be given the full text of a tender/RFP/RFQ document. Return ONLY a valid JSON object — no markdown, no commentary.

Schema:
{
  "submission_deadline": "YYYY-MM-DD or YYYY-MM-DD HH:MM, or null",
  "budget_figures": [{"label": "string", "amount_pkr": number or null, "raw_text": "string"}],
  "evaluation_criteria": [{"name": "string", "weight_pct": number}],
  "mandatory_requirements": [{"text": "string", "category": "technical|financial|legal|experience|certification|other", "page": number or null}],
  "qa_sections": [{"question": "string", "order": number}]
}

Rules:
- Capture every clause with "must", "shall", "required", "mandatory", "minimum" as a mandatory_requirement.
- Missing field -> null or empty array, never omit the key.
- Output nothing except the JSON object."""

def extract_rfp_structure(raw_text: str) -> dict:
    response = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=4096,
        system=EXTRACTION_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": raw_text}],
    )
    return json.loads(response.content[0].text)
```

On JSON parse failure, retry once with the parse error appended as a follow-up message. Do not retry a second time; surface the failure to the UI.

---

## 4. RAG retrieval — `services/rag_service.py`

```python
from sentence_transformers import SentenceTransformer
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def embed_text(text: str) -> list[float]:
    return embedder.encode(text).tolist()

def retrieve_top_matches(requirement_text: str, db_connection, top_k: int = 3) -> list[dict]:
    qe = embed_text(requirement_text)
    rows = db_connection.execute(
        """SELECT capability_id, chunk_text, 1 - (embedding <=> %(qe)s) AS similarity
           FROM capability_embeddings ORDER BY embedding <=> %(qe)s LIMIT %(k)s""",
        {"qe": qe, "k": top_k},
    ).fetchall()
    return [dict(r) for r in rows]
```

Embed `capability_library` once at seed time (`scripts/seed_capability_library.py`), not per-request. Chunk `summary_text` at ~300 words.

---

## 5. Compliance matching — `services/compliance_service.py`

```python
MATCHING_PROMPT_TEMPLATE = """Evaluate whether the company's past work satisfies this tender requirement.

Requirement: {requirement_text}

Evidence (top 3 matches from capability library):
1. {chunk_1}
2. {chunk_2}
3. {chunk_3}

Return JSON only:
{{
  "match_status": "matched" | "partial" | "gap",
  "confidence": number 0-1,
  "draft_paragraph": string or null
}}

Rules:
- "matched": confidence >= 0.7 and a chunk directly addresses the requirement.
- "partial": confidence between 0.4 and 0.7.
- "gap": confidence < 0.4 or no relevant chunk.
- draft_paragraph only if matched/partial. 2-4 sentences, proposal-ready, citing specific evidence. Never invent facts."""

def evaluate_requirement(requirement_text: str, evidence_chunks: list[str]) -> dict:
    padded = (evidence_chunks + ["None", "None", "None"])[:3]
    prompt = MATCHING_PROMPT_TEMPLATE.format(
        requirement_text=requirement_text, chunk_1=padded[0], chunk_2=padded[1], chunk_3=padded[2],
    )
    response = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(response.content[0].text)
```

One call fills both `compliance_checklist` and `draft_sections`. Checklist sort order: `gap` before `partial` before `matched`; within each, `legal`/`certification` first.

---

## 6. Win-probability — `services/scoring_service.py`

```python
def compute_budget_alignment_score(rfp_budget, sector, capability_library):
    similar = [c["contract_value"] for c in capability_library if c["sector"] == sector and c["contract_value"]]
    if not similar: return 0.5
    avg = sum(similar) / len(similar)
    return min(rfp_budget, avg) / max(rfp_budget, avg)

def compute_past_sector_win_rate(sector, historical_bids):
    sector_bids = [b for b in historical_bids if b["sector"] == sector]
    if not sector_bids: return 0.5
    return sum(1 for b in sector_bids if b["won"]) / len(sector_bids)

def compute_compliance_pass_rate(checklist):
    if not checklist: return 0.0
    matched = sum(1 for c in checklist if c["match_status"] == "matched")
    partial = sum(1 for c in checklist if c["match_status"] == "partial")
    return (matched + 0.5 * partial) / len(checklist)

def compute_competitor_score(competitor_count):
    if competitor_count <= 2: return 1.0
    if competitor_count <= 5: return 0.6
    if competitor_count <= 10: return 0.3
    return 0.1

WEIGHTS = {"budget_alignment": 0.25, "past_win_rate": 0.30, "compliance_pass_rate": 0.30, "competitor": 0.15}

def compute_win_probability(budget_alignment, past_win_rate, compliance_pass_rate, competitor_score):
    return (WEIGHTS["budget_alignment"] * budget_alignment + WEIGHTS["past_win_rate"] * past_win_rate
            + WEIGHTS["compliance_pass_rate"] * compliance_pass_rate + WEIGHTS["competitor"] * competitor_score)
```

These weights are fixed for v1 — not a placeholder pending tuning. Upgrade path once `historical_bids` has real rows:

```python
from sklearn.linear_model import LogisticRegression
import joblib

def train_scoring_model(df):
    X = df[["budget_alignment", "past_win_rate", "compliance_pass_rate", "competitor_score"]]
    model = LogisticRegression(max_iter=1000).fit(X, df["won"])
    joblib.dump(model, "scoring_model.joblib")
```

Same four inputs, probability output — the swap is a single `if` branch in `scoring_service.py`.

---

## 7. GO/NO-GO — exact thresholds

```python
def decide(win_probability, checklist):
    critical_gaps = [c for c in checklist if c["match_status"] == "gap"
                      and c["category"] in ("legal", "certification") and not c["manager_override"]]
    if win_probability >= 0.6 and not critical_gaps: decision = "GO"
    elif win_probability < 0.35 or critical_gaps: decision = "NO-GO"
    else: decision = "CONDITIONAL"
    rationale = f"Win probability {win_probability:.0%}. {len(critical_gaps)} unresolved legal/certification gap(s)."
    return decision, rationale
```

`legal`/`certification` gaps force NO-GO. `technical`/`financial`/`experience` gaps only lower the score.

---

## 8. Export — `services/export_service.py`

```python
from docx import Document

def export_proposal(sections: list[dict], output_path: str) -> str:
    doc = Document()
    doc.add_heading("Technical Proposal", level=1)
    for s in sorted(sections, key=lambda s: s["section_order"]):
        doc.add_heading(s["question_text"], level=2)
        doc.add_paragraph(s.get("edited_text") or s.get("draft_text") or "[Not yet drafted]")
    doc.save(output_path)
    return output_path
```

---

## 9. API Routes — `main.py`

```
POST   /workspaces                              create workspace
POST   /workspaces/{id}/upload                  upload RFP, store raw_text
POST   /workspaces/{id}/extract                  -> extraction_service
GET    /workspaces/{id}/requirements
POST   /workspaces/{id}/match-capabilities       -> rag_service + compliance_service, loop over requirements
GET    /workspaces/{id}/checklist                gap-first sorted
POST   /workspaces/{id}/score                    -> scoring_service + decide()
GET    /workspaces/{id}/dashboard                bid_scores row + checklist counts
PUT    /workspaces/{id}/sections/{section_id}     update edited_text / approved
POST   /workspaces/{id}/export                    -> export_service
POST   /capability-library/seed                   bulk insert + embed the 50 records
```

---

## 10. Frontend — file tree

```
/app
  page.tsx                              GET /workspaces, cards with status badge
  /workspace/[id]/page.tsx              tabs: Requirements | Checklist | Drafts | Scoring | Export
  /workspace/[id]/requirements/page.tsx GET .../requirements
  /workspace/[id]/checklist/page.tsx    <ChecklistRow> per item — gap=red, partial=yellow, matched=green
  /workspace/[id]/drafts/page.tsx       <DraftEditor> per qa_section
  /workspace/[id]/scoring/page.tsx      POST .../score on mount -> <ScoreGauge> + <CriteriaBarChart> + <GoNoGoBanner>
/components
  ChecklistRow.tsx       { requirement_text, match_status, confidence, evidence_summary, category }
  DraftEditor.tsx        { section_id, question_text, draft_text, edited_text, approved } — Save/Approve -> PUT
  ScoreGauge.tsx          { win_probability } — recharts RadialBarChart
  CriteriaBarChart.tsx    { budget_alignment_score, past_win_rate_score, compliance_pass_rate, competitor_score }
  GoNoGoBanner.tsx        { decision, rationale } — red/green/yellow
```

---

## 11. Build Order

1. Run DDL (Section 2). Seed `capability_library` + embed (Section 4) first — RAG is useless without it.
2. Build `extraction_service.py`, wire `/extract`, test on one sample RFP until JSON is reliable.
3. Build `rag_service.py` + `compliance_service.py`, wire `/match-capabilities`. Verify gap-first sorting.
4. Build `scoring_service.py` V1, wire `/score` + `/dashboard`.
5. Build frontend against the working backend — not mocked data.
6. Build `export_service.py`, wire `/export`.
7. Run the other 2 sample RFPs through the pipeline, fix breakage.

Team split (3 people): A = extraction + RAG + compliance (steps 2-3). B = scoring + export (steps 4, 6). C = frontend (step 5), starts once step 3 is done. One person owns all prompt edits.

---

## 12. Cut order if short on time

Multi-RFP demo → V2 sklearn model → DraftEditor inline editing (read-only ok) → export styling (plain DOCX). Gap-first sorting (Section 5) is required in every cut scenario.
