import os
import json
import urllib.request
import urllib.parse
import math
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

class Row(dict):
    """A dictionary subclass that supports positional index access like a tuple, matching psycopg2 row behaviors."""
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self.values())[key]
        return super().__getitem__(key)

def execute_query_rest(query, params=None):
    """Translates standard SQL queries into PostgREST API requests to Supabase."""
    q = " ".join(query.strip().split())
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    if q.startswith("INSERT INTO workspaces"):
        # INSERT INTO workspaces (name, sector, status) VALUES (%s, %s, 'draft')
        name, sector = params[0], params[1]
        data = {"name": name, "sector": sector, "status": "draft"}
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/workspaces",
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
            
    elif q.startswith("SELECT id FROM workspaces WHERE id =") or q.startswith("SELECT id, name, sector FROM workspaces WHERE id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/workspaces?id=eq.{ws_id}&select=id,name,sector",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("SELECT raw_text FROM rfp_documents WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/rfp_documents?workspace_id=eq.{ws_id}&select=raw_text",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("DELETE FROM rfp_documents WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/rfp_documents?workspace_id=eq.{ws_id}",
            headers=headers,
            method="DELETE"
        )
        with urllib.request.urlopen(req) as resp:
            resp.read()
            return []

    elif q.startswith("INSERT INTO rfp_documents"):
        ws_id, file_path, raw_text = params[0], params[1], params[2]
        data = {"workspace_id": ws_id, "file_path": file_path, "raw_text": raw_text}
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/rfp_documents",
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("DELETE FROM requirements WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/requirements?workspace_id=eq.{ws_id}",
            headers=headers,
            method="DELETE"
        )
        with urllib.request.urlopen(req) as resp:
            resp.read()
            return []

    elif q.startswith("DELETE FROM evaluation_criteria WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/evaluation_criteria?workspace_id=eq.{ws_id}",
            headers=headers,
            method="DELETE"
        )
        with urllib.request.urlopen(req) as resp:
            resp.read()
            return []

    elif q.startswith("DELETE FROM qa_sections WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/qa_sections?workspace_id=eq.{ws_id}",
            headers=headers,
            method="DELETE"
        )
        with urllib.request.urlopen(req) as resp:
            resp.read()
            return []

    elif q.startswith("INSERT INTO requirements"):
        ws_id, text, cat, page = params[0], params[1], params[2], params[3]
        data = {"workspace_id": ws_id, "requirement_text": text, "category": cat, "source_page": page}
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/requirements",
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("INSERT INTO evaluation_criteria"):
        ws_id, name, weight = params[0], params[1], params[2]
        data = {"workspace_id": ws_id, "criterion_name": name, "weight_pct": float(weight)}
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/evaluation_criteria",
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("INSERT INTO qa_sections"):
        ws_id, text, order = params[0], params[1], params[2]
        data = {"workspace_id": ws_id, "question_text": text, "section_order": int(order)}
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/qa_sections",
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("SELECT COUNT(*) FROM requirements WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/requirements?workspace_id=eq.{ws_id}&select=id",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            return [{"count": len(rows)}]

    elif q.startswith("SELECT COUNT(*) FROM requirements") and "workspace_id" not in q:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/requirements?select=id",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            return [{"count": len(rows)}]

    elif q.startswith("SELECT COUNT(*) FROM qa_sections WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/qa_sections?workspace_id=eq.{ws_id}&select=id",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            return [{"count": len(rows)}]

    elif q.startswith("SELECT COUNT(*) FROM qa_sections") and "workspace_id" not in q:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/qa_sections?select=id",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            return [{"count": len(rows)}]

    elif q.startswith("SELECT COUNT(*) FROM evaluation_criteria WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/evaluation_criteria?workspace_id=eq.{ws_id}&select=id",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            return [{"count": len(rows)}]

    elif q.startswith("SELECT COUNT(*) FROM rfp_documents"):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/rfp_documents?select=id",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            return [{"count": len(rows)}]

    elif "capability_embeddings" in q and "<=>" in q:
        # Vector similarity search query:
        # SELECT capability_id, chunk_text, 1 - (embedding <=> %s) AS similarity FROM capability_embeddings ORDER BY embedding <=> %s LIMIT %s
        qe_param = params[0]
        if isinstance(qe_param, str):
            # Parse '[0.1, 0.2, ...]'
            qe = [float(x) for x in qe_param.strip('[]').split(',')]
        else:
            qe = list(qe_param)
        top_k = int(params[2])
        
        # Fetch all capability embeddings via REST with joined library metadata
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/capability_embeddings?select=capability_id,chunk_text,embedding,capability_library(project_title,sector,certification,year_completed,contract_value,client_type)",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            all_rows = json.loads(resp.read().decode("utf-8"))
            
        # Calculate similarity in Python
        matches = []
        for row in all_rows:
            emb_val = row["embedding"]
            if isinstance(emb_val, str):
                row_emb = [float(x) for x in emb_val.strip('[]').split(',')]
            else:
                row_emb = list(emb_val)
            
            # Compute Cosine Similarity
            dot = sum(x * y for x, y in zip(qe, row_emb))
            n1 = math.sqrt(sum(x * x for x in qe))
            n2 = math.sqrt(sum(x * x for x in row_emb))
            similarity = dot / (n1 * n2) if n1 and n2 else 0.0
            
            # Enrich chunk_text with capability library metadata for LLM evaluation
            lib = row.get("capability_library") or {}
            cert_str = lib.get("certification") or "None"
            val_str = f"${lib.get('contract_value'):,.0f}" if lib.get("contract_value") else "None"
            enriched_text = (
                f"Project Title: {lib.get('project_title', 'Unknown')} | "
                f"Sector: {lib.get('sector', 'Unknown')} | "
                f"Certifications: {cert_str} | "
                f"Contract Value: {val_str} | "
                f"Year Completed: {lib.get('year_completed', 'Unknown')} | "
                f"Client Type: {lib.get('client_type', 'Unknown')}\n"
                f"Summary: {row['chunk_text']}"
            )
            
            matches.append({
                "capability_id": row["capability_id"],
                "chunk_text": enriched_text,
                "similarity": similarity
            })
            
        # Sort descending and take top_k
        matches.sort(key=lambda x: x["similarity"], reverse=True)
        return matches[:top_k]


    elif q.startswith("SELECT id, requirement_text, category, source_page FROM requirements WHERE workspace_id =") or q.startswith("SELECT id, workspace_id, requirement_text, category, source_page FROM requirements WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/requirements?workspace_id=eq.{ws_id}&select=id,workspace_id,requirement_text,category,source_page",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("SELECT id, question_text, section_order FROM qa_sections WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/qa_sections?workspace_id=eq.{ws_id}&select=id,question_text,section_order",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("DELETE FROM compliance_checklist WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/compliance_checklist?workspace_id=eq.{ws_id}",
            headers=headers,
            method="DELETE"
        )
        with urllib.request.urlopen(req) as resp:
            resp.read()
            return []

    elif q.startswith("DELETE FROM draft_sections WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/draft_sections?workspace_id=eq.{ws_id}",
            headers=headers,
            method="DELETE"
        )
        with urllib.request.urlopen(req) as resp:
            resp.read()
            return []

    elif q.startswith("INSERT INTO compliance_checklist"):
        # INSERT INTO compliance_checklist (workspace_id, requirement_id, match_status, confidence_score, evidence_capability_id) VALUES (%s, %s, %s, %s, %s)
        ws_id, req_id, status, confidence, evidence_id = params[0], params[1], params[2], params[3], params[4]
        data = {
            "workspace_id": ws_id,
            "requirement_id": req_id,
            "match_status": status,
            "confidence_score": float(confidence),
            "evidence_capability_id": evidence_id
        }
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/compliance_checklist",
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("INSERT INTO draft_sections"):
        # INSERT INTO draft_sections (workspace_id, qa_section_id, draft_text) VALUES (%s, %s, %s)
        ws_id, qa_id, draft_text = params[0], params[1], params[2]
        data = {
            "workspace_id": ws_id,
            "qa_section_id": qa_id,
            "draft_text": draft_text
        }
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/draft_sections",
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif "compliance_checklist" in q and "JOIN requirements" in q:
        # SELECT c.id, c.workspace_id, c.requirement_id, c.match_status, c.confidence_score, c.evidence_capability_id, c.manager_override, r.requirement_text, r.category, r.source_page FROM compliance_checklist c JOIN requirements r ON c.requirement_id = r.id WHERE c.workspace_id = %s
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/compliance_checklist?workspace_id=eq.{ws_id}&select=id,workspace_id,requirement_id,match_status,confidence_score,evidence_capability_id,manager_override,requirements(requirement_text,category,source_page)",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            items = json.loads(resp.read().decode("utf-8"))
            
        flat_items = []
        for item in items:
            req_data = item.get("requirements") or {}
            flat_items.append({
                "id": item["id"],
                "workspace_id": item["workspace_id"],
                "requirement_id": item["requirement_id"],
                "match_status": item["match_status"],
                "confidence_score": item["confidence_score"],
                "evidence_capability_id": item["evidence_capability_id"],
                "manager_override": item["manager_override"],
                "requirement_text": req_data.get("requirement_text"),
                "category": req_data.get("category"),
                "source_page": req_data.get("source_page")
            })
            
        # Perform gap-first sorting in Python
        status_order = {"gap": 1, "partial": 2, "matched": 3}
        flat_items.sort(key=lambda x: (
            status_order.get(x["match_status"], 4),
            1 if x["category"] in ("legal", "certification") else 2,
            x["id"]
        ))
        return flat_items

    elif q.startswith("SELECT COUNT(*) FROM compliance_checklist"):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/compliance_checklist?select=id",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            return [{"count": len(rows)}]

    elif q.startswith("SELECT COUNT(*) FROM draft_sections"):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/draft_sections?select=id",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            return [{"count": len(rows)}]

    elif q.startswith("SELECT id, name FROM workspaces WHERE name ="):
        name = params[0]
        encoded_name = urllib.parse.quote(name)
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/workspaces?name=eq.{encoded_name}&select=id,name",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("SELECT id, name, sector, status, created_at FROM workspaces"):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/workspaces?select=id,name,sector,status,created_at&order=created_at.desc",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("DELETE FROM workspaces WHERE id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/workspaces?id=eq.{ws_id}",
            headers=headers,
            method="DELETE"
        )
        with urllib.request.urlopen(req) as resp:
            resp.read()
            return []

    elif q.startswith("TRUNCATE TABLE capability_library") or q.startswith("DELETE FROM capability_embeddings") or q.startswith("DELETE FROM capability_library"):
        # Delete embeddings
        req1 = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/capability_embeddings?id=not.is.null",
            headers=headers,
            method="DELETE"
        )
        with urllib.request.urlopen(req1) as resp:
            resp.read()
        
        # Delete capability library
        req2 = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/capability_library?id=not.is.null",
            headers=headers,
            method="DELETE"
        )
        with urllib.request.urlopen(req2) as resp:
            resp.read()
        return []

    elif q.startswith("INSERT INTO capability_library"):
        title, sector, cert, year, value, duration, client, summary = (
            params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7]
        )
        data = {
            "project_title": title,
            "sector": sector,
            "certification": cert,
            "year_completed": int(year) if year is not None else None,
            "contract_value": float(value) if value is not None else None,
            "duration_months": int(duration) if duration is not None else None,
            "client_type": client,
            "summary_text": summary
        }
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/capability_library",
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("INSERT INTO capability_embeddings"):
        cap_id, chunk, embedding_val = params[0], params[1], params[2]
        if isinstance(embedding_val, str):
            emb_list = [float(x) for x in embedding_val.strip('[]').split(',')]
        else:
            emb_list = list(embedding_val)
        data = {
            "capability_id": cap_id,
            "chunk_text": chunk,
            "embedding": emb_list
        }
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/capability_embeddings",
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("SELECT COUNT(*) FROM capability_library"):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/capability_library?select=id",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            return [{"count": len(rows)}]

    elif q.startswith("SELECT COUNT(*) FROM capability_embeddings"):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/capability_embeddings?select=id",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            return [{"count": len(rows)}]

    elif q.startswith("DELETE FROM bid_scores WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/bid_scores?workspace_id=eq.{ws_id}",
            headers=headers,
            method="DELETE"
        )
        with urllib.request.urlopen(req) as resp:
            resp.read()
            return []

    elif q.startswith("INSERT INTO bid_scores"):
        ws_id, win_prob, budget_score, win_rate_score, compliance_rate, competitor, decision, rationale = params
        data = {
            "workspace_id": ws_id,
            "win_probability": float(win_prob),
            "budget_alignment_score": float(budget_score),
            "past_win_rate_score": float(win_rate_score),
            "compliance_pass_rate": float(compliance_rate),
            "competitor_score": float(competitor),
            "go_no_go": decision,
            "rationale": rationale
        }
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/bid_scores",
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("SELECT win_probability, budget_alignment_score, past_win_rate_score, compliance_pass_rate, competitor_score, go_no_go, rationale FROM bid_scores WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/bid_scores?workspace_id=eq.{ws_id}&select=win_probability,budget_alignment_score,past_win_rate_score,compliance_pass_rate,competitor_score,go_no_go,rationale",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("SELECT sector, contract_value FROM capability_library"):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/capability_library?select=sector,contract_value",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("SELECT sector, won FROM historical_bids"):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/historical_bids?select=sector,won",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("SELECT COUNT(*) FROM historical_bids"):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/historical_bids?select=id",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
            return [{"count": len(rows)}]

    elif q.startswith("SELECT workspace_id, file_path, uploaded_at FROM rfp_documents") and "WHERE" not in q:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/rfp_documents?select=workspace_id,file_path,uploaded_at",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("SELECT workspace_id, win_probability, compliance_pass_rate, go_no_go FROM bid_scores") and "WHERE" not in q:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/bid_scores?select=workspace_id,win_probability,compliance_pass_rate,go_no_go",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif q.startswith("SELECT id, file_path, uploaded_at FROM rfp_documents WHERE workspace_id ="):
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/rfp_documents?workspace_id=eq.{ws_id}&select=id,file_path,uploaded_at",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    elif "draft_sections" in q and "JOIN qa_sections" in q:
        ws_id = params[0]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/draft_sections?workspace_id=eq.{ws_id}&select=id,workspace_id,qa_section_id,draft_text,qa_sections(question_text,section_order)",
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req) as resp:
            items = json.loads(resp.read().decode("utf-8"))
            
        flat_items = []
        for item in items:
            q_data = item.get("qa_sections") or {}
            flat_items.append({
                "id": item["id"],
                "workspace_id": item["workspace_id"],
                "qa_section_id": item["qa_section_id"],
                "draft_text": item["draft_text"],
                "question_text": q_data.get("question_text"),
                "section_order": q_data.get("section_order")
            })
        flat_items.sort(key=lambda x: x.get("section_order") or 0)
        return flat_items


    else:
        raise NotImplementedError(f"REST fallback query type not mapped: {query}")

class RestFallbackConnection:
    def __init__(self):
        self.autocommit = True
        
    def cursor(self, cursor_factory=None):
        return RestFallbackCursor(cursor_factory)
        
    def commit(self):
        pass
        
    def rollback(self):
        pass
        
    def close(self):
        pass

class RestFallbackCursor:
    def __init__(self, cursor_factory=None):
        self.cursor_factory = cursor_factory
        self.results = None
        self.idx = 0
        
    def execute(self, query, params=None):
        self.results = execute_query_rest(query, params)
        self.idx = 0
        
    def fetchall(self):
        if self.results is None:
            return []
        return [Row(r) for r in self.results]
        
    def fetchone(self):
        if self.results and self.idx < len(self.results):
            r = self.results[self.idx]
            self.idx += 1
            return Row(r)
        return None
        
    def close(self):
        pass

def get_db_connection():
    """Returns a connection to the Supabase database. Falls back to REST connection if blocked."""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set.")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"[Warning] psycopg2 connect failed ({e}). Using REST API fallback connection...")
        return RestFallbackConnection()

def execute_query(query, params=None, fetch=False):
    """Executes a query. Tries psycopg2 first; on failure, falls back to REST API."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        try:
            cur.execute(query, params)
            if fetch:
                results = cur.fetchall()
            else:
                results = None
            conn.commit()
            return results
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()
            conn.close()
    except Exception as db_err:
        print(f"[Warning] DB direct query failed ({db_err}). Falling back to REST API query...")
        try:
            results = execute_query_rest(query, params)
            if fetch and results:
                return [Row(r) for r in results]
            return results
        except Exception as rest_err:
            print(f"[Error] REST API query fallback failed: {rest_err}")
            raise db_err

