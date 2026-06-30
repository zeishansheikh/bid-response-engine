import os
import time
import shutil
import uuid
import re
from datetime import datetime, timezone
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_db_connection, execute_query
from services.parsing_service import extract_text
from services.extraction_service import extract_rfp_structure
from services.rag_service import retrieve_top_matches
from services.compliance_service import evaluate_requirement
from services.scoring_service import (
    compute_budget_alignment_score,
    compute_past_sector_win_rate,
    compute_compliance_pass_rate,
    compute_competitor_score,
    compute_win_probability,
    decide
)
import json

def update_workspace_metadata(workspace_id: str, status: str = None, error: str = None, failed_stage: str = None, budget: float = None, competitors: int = None, **kwargs):
    # 1. Fetch current sector and status
    rows = execute_query("SELECT name, sector, status FROM workspaces WHERE id = %s;", (workspace_id,), fetch=True)
    if not rows:
        return
    current_sector = rows[0].get("sector") or "Cloud Infrastructure"
    current_status = rows[0].get("status")
    
    # 2. Parse as JSON if possible, otherwise construct dict
    metadata = {}
    if current_sector.strip().startswith("{") and current_sector.strip().endswith("}"):
        try:
            metadata = json.loads(current_sector)
        except Exception:
            metadata = {"sector": current_sector}
    else:
        metadata = {"sector": current_sector}
        
    # 3. Update fields
    if status is not None:
        current_status = status
    if error is not None:
        metadata["error_message"] = error
    else:
        metadata.pop("error_message", None)
        
    if failed_stage is not None:
        metadata["failed_stage"] = failed_stage
    else:
        metadata.pop("failed_stage", None)
        
    if budget is not None:
        metadata["budget"] = budget
    if competitors is not None:
        metadata["competitor_count"] = competitors
        
    # Track Audit Trail
    audit_trail = metadata.get("audit_trail", [])
    if status is not None:
        audit_trail.append({
            "action": f"Status changed to {status}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "Success" if error is None else "Failed"
        })
    metadata["audit_trail"] = audit_trail
        
    for k, v in kwargs.items():
        metadata[k] = v
        
    # 4. Save back to workspaces table
    serialized = json.dumps(metadata)
    execute_query("UPDATE workspaces SET sector = %s, status = %s WHERE id = %s;", (serialized, current_status, workspace_id))

class ScoreRequest(BaseModel):
    rfp_budget: float
    competitor_count: int

app = FastAPI(title="AI-Powered Bid & Proposal Response Engine")
@app.get("/", tags=["System"])
async def root():
    return {
        "status": "healthy",
        "application": "Enterprise AI-Powered Bid & Proposal Response Engine",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/health", tags=["System"])
async def health_check():
    """Production health check endpoint."""
    return {
        "status": "healthy",
        "service": "BidEngine API",
        "database": "connected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/version", tags=["System"])
async def get_version():
    """Return application version information."""
    return {
        "application": "Enterprise AI-Powered Bid & Proposal Response Engine",
        "version": "1.0.0",
        "api": "v1"
    }

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class WorkspaceCreate(BaseModel):
    name: str
    sector: str

@app.post("/workspaces")
def create_workspace(workspace: WorkspaceCreate):
    try:
        query = """
            INSERT INTO workspaces (name, sector, status)
            VALUES (%s, %s, 'draft')
            RETURNING id, name, sector, status, created_at;
        """
        result = execute_query(query, (workspace.name, workspace.sector), fetch=True)
        if result:
            return result[0]
        raise HTTPException(status_code=500, detail="Failed to create workspace.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workspaces")
def get_all_workspaces():
    try:
        query = "SELECT id, name, sector, status, created_at FROM workspaces;"
        result = execute_query(query, fetch=True)
        return result or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workspaces/history")
def get_workspaces_history():
    try:
        workspaces = execute_query(
            "SELECT id, name, sector, status, created_at FROM workspaces;",
            fetch=True
        ) or []
        
        docs = execute_query(
            "SELECT workspace_id, file_path, uploaded_at FROM rfp_documents;",
            fetch=True
        ) or []
        
        scores = execute_query(
            "SELECT workspace_id, win_probability, compliance_pass_rate, go_no_go FROM bid_scores;",
            fetch=True
        ) or []
        
        doc_map = {d["workspace_id"]: d for d in docs}
        score_map = {s["workspace_id"]: s for s in scores}
        
        history = []
        for ws in workspaces:
            ws_id = ws["id"]
            doc = doc_map.get(ws_id)
            score = score_map.get(ws_id)
            
            rfp_name = "Pending Upload"
            upload_date = None
            if doc:
                file_path = doc["file_path"]
                base_name = os.path.basename(file_path)
                if len(base_name) > 37 and base_name[36] == '_':
                    rfp_name = base_name[37:]
                else:
                    rfp_name = base_name
                upload_date = doc["uploaded_at"]
                
            history.append({
                "workspace_id": ws_id,
                "workspace_name": ws["name"],
                "sector": ws["sector"],
                "rfp_name": rfp_name,
                "upload_date": upload_date.isoformat() if upload_date and not isinstance(upload_date, str) else upload_date,
                "win_probability": score["win_probability"] if score else None,
                "compliance_pct": score["compliance_pass_rate"] if score else None,
                "status": ws["status"],
                "recommendation": score["go_no_go"] if score else None,
                "created_at": ws["created_at"].isoformat() if ws["created_at"] and not isinstance(ws["created_at"], str) else ws["created_at"]
            })
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workspaces/{workspace_id}/document")
def get_workspace_document(workspace_id: str):
    ws = execute_query("SELECT id FROM workspaces WHERE id = %s;", (workspace_id,), fetch=True)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
        
    doc = execute_query(
        "SELECT id, file_path, uploaded_at FROM rfp_documents WHERE workspace_id = %s;",
        (workspace_id,),
        fetch=True
    )
    if not doc:
        return None
        
    file_path = doc[0]["file_path"]
    base_name = os.path.basename(file_path)
    if len(base_name) > 37 and base_name[36] == '_':
        original_filename = base_name[37:]
    else:
        original_filename = base_name
        
    return {
        "id": doc[0]["id"],
        "file_path": file_path,
        "original_filename": original_filename,
        "uploaded_at": doc[0]["uploaded_at"]
    }

@app.get("/workspaces/{workspace_id}/proposal")
def get_workspace_proposal(workspace_id: str):
    ws = execute_query("SELECT id FROM workspaces WHERE id = %s;", (workspace_id,), fetch=True)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
        
    query = """
        SELECT d.id, d.workspace_id, d.qa_section_id, d.draft_text, q.question_text, q.section_order
        FROM draft_sections d
        JOIN qa_sections q ON d.qa_section_id = q.id
        WHERE d.workspace_id = %s;
    """
    result = execute_query(query, (workspace_id,), fetch=True)
    return result or []

@app.post("/workspaces/{workspace_id}/upload")
def upload_rfp_document(workspace_id: str, file: UploadFile = File(...)):
    # Verify workspace exists
    ws = execute_query("SELECT id FROM workspaces WHERE id = %s;", (workspace_id,), fetch=True)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
        
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".pdf", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
        
    # Sanitize the original filename to embed safely
    safe_basename = os.path.basename(file.filename)
    safe_basename = re.sub(r'[^a-zA-Z0-9._\s-]', '', safe_basename).strip()
    safe_basename = re.sub(r'[\s-]+', '_', safe_basename)
    
    # Generate unique filename to avoid conflicts and keep original name
    unique_filename = f"{uuid.uuid4()}_{safe_basename}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        # Save file to disk
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract text from the saved file
        print(f"Extracting text from {file.filename}...")
        raw_text = extract_text(dest_path)
        
        # Save to database (only keep one RFP document per workspace for simplicity, or delete previous)
        execute_query("DELETE FROM rfp_documents WHERE workspace_id = %s;", (workspace_id,))
        
        query = """
            INSERT INTO rfp_documents (workspace_id, file_path, raw_text)
            VALUES (%s, %s, %s)
            RETURNING id, workspace_id, file_path, uploaded_at;
        """
        result = execute_query(query, (workspace_id, dest_path, raw_text), fetch=True)
        if result:
            return {
                "message": "File uploaded and parsed successfully.",
                "document": result[0]
            }
        raise HTTPException(status_code=500, detail="Failed to save document details.")
    except Exception as e:
        # Clean up file on failure
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workspaces/{workspace_id}/extract")
def extract_workspace_rfp(workspace_id: str):
    # Verify document exists
    doc = execute_query("SELECT raw_text FROM rfp_documents WHERE workspace_id = %s;", (workspace_id,), fetch=True)
    if not doc:
        update_workspace_metadata(workspace_id, status="Extraction Failed", error="No RFP document uploaded", failed_stage="Extracting")
        raise HTTPException(status_code=404, detail="No RFP document uploaded for this workspace.")
        
    raw_text = doc[0]["raw_text"]
    update_workspace_metadata(workspace_id, status="Extracting")
    
    try:
        # Perform extraction
        print(f"Running LLM extraction for workspace {workspace_id}...")
        extracted_data = extract_rfp_structure(raw_text)
        
        # Save extracted data to database inside a transaction
        conn = get_db_connection()
        conn.autocommit = False
        cur = conn.cursor()
        
        try:
            # 1. Clear existing items
            cur.execute("DELETE FROM requirements WHERE workspace_id = %s;", (workspace_id,))
            cur.execute("DELETE FROM evaluation_criteria WHERE workspace_id = %s;", (workspace_id,))
            cur.execute("DELETE FROM qa_sections WHERE workspace_id = %s;", (workspace_id,))
            
            # 2. Insert mandatory requirements
            reqs = extracted_data.get("mandatory_requirements", [])
            for r in reqs:
                cur.execute(
                    """
                    INSERT INTO requirements (workspace_id, requirement_text, category, source_page)
                    VALUES (%s, %s, %s, %s);
                    """,
                    (workspace_id, r.get("text"), r.get("category", "other"), r.get("page"))
                )
                
            # 3. Insert evaluation criteria
            criteria = extracted_data.get("evaluation_criteria", [])
            print(f"[DEBUG] Processed evaluation_criteria before DB insertion: {criteria}")
            for c in criteria:
                name = c.get("name")
                weight = c.get("weight_pct")
                
                # Check if weight is numeric
                is_numeric = False
                if weight is not None:
                    try:
                        float(weight)
                        is_numeric = True
                    except (ValueError, TypeError):
                        pass
                
                if not is_numeric:
                    print(f"[WARNING] Skipping evaluation criterion '{name}' because its weight_pct is non-numeric: {weight}")
                    continue
                
                cur.execute(
                    """
                    INSERT INTO evaluation_criteria (workspace_id, criterion_name, weight_pct)
                    VALUES (%s, %s, %s);
                    """,
                    (workspace_id, name, weight)
                )
                
            # 4. Insert QA sections
            qa_secs = extracted_data.get("qa_sections", [])
            for q in qa_secs:
                cur.execute(
                    """
                    INSERT INTO qa_sections (workspace_id, question_text, section_order)
                    VALUES (%s, %s, %s);
                    """,
                    (workspace_id, q.get("question"), q.get("order"))
                )
                
            conn.commit()
            
            # Update workspace metadata with extracted budget & deadline if found
            budget_val = None
            deadline_val = None
            if isinstance(extracted_data, dict):
                budgets = extracted_data.get("budget_figures", [])
                if budgets and len(budgets) > 0:
                    budget_val = budgets[0].get("amount_pkr")
                deadline_val = extracted_data.get("submission_deadline")
                
            update_workspace_metadata(
                workspace_id, 
                status="Extracted", 
                budget=budget_val, 
                submission_deadline=deadline_val
            )
            return extracted_data
            
        except Exception as db_err:
            conn.rollback()
            raise db_err
        finally:
            cur.close()
            conn.close()
            
    except Exception as e:
        import sys
        import traceback
        
        exc_type, exc_value, exc_traceback = sys.exc_info()
        tb_frames = traceback.extract_tb(exc_traceback)
        
        log_lines = []
        log_lines.append("================ DETAILED EXTRACTION ERROR ================")
        log_lines.append(f"Workspace ID: {workspace_id}")
        log_lines.append(f"Exception Type: {exc_type.__name__ if exc_type else 'Unknown'}")
        log_lines.append(f"Exception Message: {str(e)}")
        log_lines.append("\nStack Trace (Innermost first):")
        
        for frame_summary in reversed(tb_frames):
            log_lines.append(f"  File: {frame_summary.filename}")
            log_lines.append(f"  Line: {frame_summary.lineno}")
            log_lines.append(f"  Function: {frame_summary.name}")
            log_lines.append(f"  Statement: {frame_summary.line}")
            log_lines.append("")
            
        current_tb = exc_traceback
        while current_tb and current_tb.tb_next:
            current_tb = current_tb.tb_next
        if current_tb:
            frame = current_tb.tb_frame
            log_lines.append("Local Variables at failure point:")
            for var_name, var_val in frame.f_locals.items():
                val_str = repr(var_val)
                if len(val_str) > 1000:
                    val_str = val_str[:1000] + "... [TRUNCATED]"
                log_lines.append(f"  {var_name} = {val_str}")
        
        log_lines.append("===========================================================")
        detailed_log = "\n".join(log_lines)
        print(detailed_log)
        
        update_workspace_metadata(workspace_id, status="Extraction Failed", error=str(e), failed_stage="Extracting")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}\n\n{detailed_log}")

@app.get("/workspaces/{workspace_id}/requirements")
def get_workspace_requirements(workspace_id: str):
    # Verify workspace exists
    ws = execute_query("SELECT id FROM workspaces WHERE id = %s;", (workspace_id,), fetch=True)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
        
    query = """
        SELECT id, workspace_id, requirement_text, category, source_page
        FROM requirements
        WHERE workspace_id = %s;
    """
    result = execute_query(query, (workspace_id,), fetch=True)
    return result

@app.post("/workspaces/{workspace_id}/match-capabilities")
def match_workspace_capabilities(workspace_id: str):
    # 1. Verify workspace exists
    ws = execute_query("SELECT id FROM workspaces WHERE id = %s;", (workspace_id,), fetch=True)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
        
    # 2. Fetch all requirements for the workspace
    requirements = execute_query(
        "SELECT id, requirement_text, category, source_page FROM requirements WHERE workspace_id = %s;",
        (workspace_id,),
        fetch=True
    ) or []
    
    update_workspace_metadata(workspace_id, status="Matching")
    provider = os.getenv("LLM_PROVIDER", "anthropic").lower()
    
    try:
        # Clear existing matches
        execute_query("DELETE FROM compliance_checklist WHERE workspace_id = %s;", (workspace_id,))
        
        # Match requirements
        print(f"Matching {len(requirements)} requirements...")
        for r in requirements:
            req_id = r["id"]
            req_text = r["requirement_text"]
            
            # Retrieve top 5 matches
            matches = retrieve_top_matches(req_text, top_k=5)
            
            # Evaluate using LLM
            eval_res = evaluate_requirement(req_text, matches)
            
            # Determine evidence capability ID
            evidence_idx = eval_res.get("evidence_chunk_index")
            evidence_capability_id = None
            if evidence_idx is not None and isinstance(evidence_idx, int) and 1 <= evidence_idx <= len(matches):
                evidence_capability_id = matches[evidence_idx - 1]["capability_id"]
                
            # Insert into compliance_checklist
            execute_query(
                """
                INSERT INTO compliance_checklist 
                (workspace_id, requirement_id, match_status, confidence_score, evidence_capability_id)
                VALUES (%s, %s, %s, %s, %s);
                """,
                (workspace_id, req_id, eval_res.get("match_status", "gap"), eval_res.get("confidence", 0.0), evidence_capability_id)
            )
            
            # Sleep if using Groq to stay under rate limits
            if provider == "groq":
                time.sleep(2)
                
        update_workspace_metadata(workspace_id, status="Matched")
        return {"message": "Capabilities matched and compliance checklist generated successfully."}
        
    except Exception as e:
        update_workspace_metadata(workspace_id, status="Matching Failed", error=str(e), failed_stage="Matching")
        raise HTTPException(status_code=500, detail=f"Match capabilities failed: {str(e)}")

@app.post("/workspaces/{workspace_id}/generate-proposal")
def generate_workspace_proposal(workspace_id: str):
    # Verify workspace exists
    ws = execute_query("SELECT id FROM workspaces WHERE id = %s;", (workspace_id,), fetch=True)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
        
    # Fetch all qa_sections for the workspace
    qa_sections = execute_query(
        "SELECT id, question_text, section_order FROM qa_sections WHERE workspace_id = %s;",
        (workspace_id,),
        fetch=True
    ) or []
    
    update_workspace_metadata(workspace_id, status="Generating Proposal")
    provider = os.getenv("LLM_PROVIDER", "anthropic").lower()
    
    try:
        # Clear existing draft sections
        execute_query("DELETE FROM draft_sections WHERE workspace_id = %s;", (workspace_id,))
        
        # Match and draft QA sections (questions)
        print(f"Drafting {len(qa_sections)} QA sections...")
        for q in qa_sections:
            qa_id = q["id"]
            q_text = q["question_text"]
            
            # Retrieve top 5 matches
            matches = retrieve_top_matches(q_text, top_k=5)
            
            # Evaluate/Draft using LLM
            eval_res = evaluate_requirement(q_text, matches)
            
            # Insert into draft_sections
            execute_query(
                """
                INSERT INTO draft_sections (workspace_id, qa_section_id, draft_text)
                VALUES (%s, %s, %s);
                """,
                (workspace_id, qa_id, eval_res.get("draft_paragraph") or "[No matching capability evidence found to draft this section]")
            )
            
            if provider == "groq":
                time.sleep(2)
                
        update_workspace_metadata(workspace_id, status="Proposal Generated")
        return {"message": "Proposal drafts generated successfully."}
    except Exception as e:
        update_workspace_metadata(workspace_id, status="Proposal Generation Failed", error=str(e), failed_stage="Generating Proposal")
        raise HTTPException(status_code=500, detail=f"Proposal generation failed: {str(e)}")

@app.get("/workspaces/{workspace_id}/checklist")
def get_workspace_checklist(workspace_id: str):
    # Verify workspace exists
    ws = execute_query("SELECT id FROM workspaces WHERE id = %s;", (workspace_id,), fetch=True)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
        
    query = """
        SELECT c.id, c.workspace_id, c.requirement_id, c.match_status, c.confidence_score, c.evidence_capability_id, c.manager_override,
               r.requirement_text, r.category, r.source_page
        FROM compliance_checklist c
        JOIN requirements r ON c.requirement_id = r.id
        WHERE c.workspace_id = %s;
    """
    checklist = execute_query(query, (workspace_id,), fetch=True) or []
    
    # Perform gap-first sorting (sorting: gap -> partial -> matched; within each, legal/certification categories first)
    status_order = {"gap": 1, "partial": 2, "matched": 3}
    
    def sort_key(x):
        s_val = status_order.get(x.get("match_status"), 4)
        c_val = 1 if x.get("category") in ("legal", "certification") else 2
        return (s_val, c_val, x.get("id", ""))
        
    checklist.sort(key=sort_key)
    return checklist

@app.post("/workspaces/{workspace_id}/score")
def calculate_workspace_score(workspace_id: str, req_body: ScoreRequest):
    # Verify workspace exists and get details
    ws = execute_query(
        "SELECT id, name, sector FROM workspaces WHERE id = %s;",
        (workspace_id,),
        fetch=True
    )
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
    
    sector_raw = ws[0]["sector"] or "Cloud Infrastructure"
    sector = sector_raw
    if sector_raw.strip().startswith("{") and sector_raw.strip().endswith("}"):
        try:
            metadata = json.loads(sector_raw)
            sector = metadata.get("sector") or "Cloud Infrastructure"
        except Exception:
            pass
            
    update_workspace_metadata(workspace_id, status="Scoring", budget=req_body.rfp_budget, competitors=req_body.competitor_count)
    
    try:
        # 1. Fetch capability library
        capability_library = execute_query(
            "SELECT sector, contract_value FROM capability_library;",
            fetch=True
        ) or []
        
        # 2. Fetch historical bids
        historical_bids = execute_query(
            "SELECT sector, won FROM historical_bids;",
            fetch=True
        ) or []
        
        # 3. Fetch checklist
        query_checklist = """
            SELECT c.id, c.workspace_id, c.requirement_id, c.match_status, c.confidence_score, c.evidence_capability_id, c.manager_override,
                   r.requirement_text, r.category, r.source_page
            FROM compliance_checklist c
            JOIN requirements r ON c.requirement_id = r.id
            WHERE c.workspace_id = %s;
        """
        checklist = execute_query(query_checklist, (workspace_id,), fetch=True) or []
        
        # Calculate sub-scores
        budget_alignment = compute_budget_alignment_score(req_body.rfp_budget, sector, capability_library)
        past_win_rate = compute_past_sector_win_rate(sector, historical_bids)
        compliance_rate = compute_compliance_pass_rate(checklist)
        competitor = compute_competitor_score(req_body.competitor_count)
        
        # Calculate win probability
        win_prob = compute_win_probability(budget_alignment, past_win_rate, compliance_rate, competitor)
        
        # Decide GO/NO-GO
        decision, rationale = decide(win_prob, checklist)
        
        # Delete old score if it exists
        execute_query("DELETE FROM bid_scores WHERE workspace_id = %s;", (workspace_id,))
        
        # Save to database
        execute_query(
            """
            INSERT INTO bid_scores 
            (workspace_id, win_probability, budget_alignment_score, past_win_rate_score, compliance_pass_rate, competitor_score, go_no_go, rationale)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (workspace_id, win_prob, budget_alignment, past_win_rate, compliance_rate, competitor, decision, rationale)
        )
        
        update_workspace_metadata(workspace_id, status="Ready")
        
        return {
            "win_probability": win_prob,
            "budget_alignment_score": budget_alignment,
            "past_win_rate_score": past_win_rate,
            "compliance_pass_rate": compliance_rate,
            "competitor_score": competitor,
            "go_no_go": decision,
            "rationale": rationale
        }
        
    except Exception as e:
        update_workspace_metadata(workspace_id, status="Scoring Failed", error=str(e), failed_stage="Scoring")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workspaces/{workspace_id}/dashboard")
def get_workspace_dashboard(workspace_id: str):
    # Verify workspace exists
    ws = execute_query(
        "SELECT id, name, sector FROM workspaces WHERE id = %s;",
        (workspace_id,),
        fetch=True
    )
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
        
    try:
        # Fetch bid scores
        query_score = """
            SELECT win_probability, budget_alignment_score, past_win_rate_score, compliance_pass_rate, competitor_score, go_no_go, rationale 
            FROM bid_scores 
            WHERE workspace_id = %s;
        """
        score_rows = execute_query(query_score, (workspace_id,), fetch=True)
        score_data = score_rows[0] if score_rows else None
        
        # Fetch checklist counts
        query_checklist = """
            SELECT c.id, c.workspace_id, c.requirement_id, c.match_status, c.confidence_score, c.evidence_capability_id, c.manager_override,
                   r.requirement_text, r.category, r.source_page
            FROM compliance_checklist c
            JOIN requirements r ON c.requirement_id = r.id
            WHERE c.workspace_id = %s;
        """
        checklist = execute_query(query_checklist, (workspace_id,), fetch=True)
        
        total_requirements = len(checklist)
        matched_count = sum(1 for c in checklist if c.get("match_status") == "matched")
        partial_count = sum(1 for c in checklist if c.get("match_status") == "partial")
        gap_count = sum(1 for c in checklist if c.get("match_status") == "gap")
        
        return {
            "score": score_data,
            "checklist_summary": {
                "total": total_requirements,
                "matched": matched_count,
                "partial": partial_count,
                "gap": gap_count
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import json

class CopilotRequest(BaseModel):
    message: str

@app.post("/workspaces/{workspace_id}/copilot", tags=["AI Services"])
def workspace_copilot(workspace_id: str, request: CopilotRequest):
    # 1. Verify workspace exists and get name/sector
    ws = execute_query(
        "SELECT id, name, sector FROM workspaces WHERE id = %s;",
        (workspace_id,),
        fetch=True
    )
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
    
    workspace_name = ws[0]["name"]
    workspace_sector = ws[0]["sector"]

    # 2. Retrieve extracted requirements and compliance results
    try:
        query_checklist = """
            SELECT c.id, c.workspace_id, c.requirement_id, c.match_status, c.confidence_score, c.evidence_capability_id, c.manager_override,
                   r.requirement_text, r.category, r.source_page
            FROM compliance_checklist c
            JOIN requirements r ON c.requirement_id = r.id
            WHERE c.workspace_id = %s;
        """
        checklist = execute_query(query_checklist, (workspace_id,), fetch=True)
    except Exception as e:
        print(f"Error fetching checklist: {e}")
        checklist = []

    # Format requirements and compliance checklist
    req_lines = []
    for idx, item in enumerate(checklist, 1):
        req_lines.append(
            f"Requirement {idx}: {item.get('requirement_text')} | "
            f"Category: {item.get('category')} | "
            f"Status: {item.get('match_status')} | "
            f"Confidence: {item.get('confidence_score')}"
        )
    requirements_text = "\n".join(req_lines) if req_lines else "No compliance requirements found."

    # 3. Retrieve matches using the existing RAG pipeline
    try:
        matches = retrieve_top_matches(request.message, top_k=5)
    except Exception as e:
        print(f"Error running RAG: {e}")
        matches = []

    evidence_lines = []
    for idx, match in enumerate(matches, 1):
        evidence_lines.append(f"Evidence {idx} (Similarity: {match['similarity']:.2f}):\n{match['chunk_text']}")
    evidence_text = "\n\n".join(evidence_lines) if evidence_lines else "No relevant capability evidence found."

    # 4. Invoke the LLM using existing services/client
    provider = os.getenv("LLM_PROVIDER", "anthropic").lower()
    model = os.getenv("LLM_MODEL", "claude-sonnet-4-6")
    
    if provider == "groq":
        from groq import Groq
        client = Groq()
    else:
        import anthropic
        client = anthropic.Anthropic()

    system_prompt = """You are an expert bid proposal writer and assistant. You help the user write, edit, rewrite, and structure technical proposals.
You have access to the workspace information, extracted requirements, compliance evaluation status, and retrieved capability library evidence.
Analyze the user's prompt and draft a response.
If the user's query asks you to write, draft, generate, or rewrite a section, paragraph, or proposal content, you MUST generate the proposal text in the "draft" field.
If the user's query is just a question, explanation, or help request, provide the explanation in the "response" field, and set "draft" to null.

You MUST respond ONLY with a valid JSON object matching this schema:
{
  "response": "Your markdown explanation, conversational response, or summary of the action taken.",
  "draft": "The actual proposal draft text (string) if requested/generated, otherwise null.",
  "citations": ["list of cited requirement IDs or capability references"],
  "sources": ["list of source titles or document references"]
}
Do not output any markdown code blocks, comments, or explanations outside the JSON."""

    prompt = f"""User Request: {request.message}

Workspace Context:
- ID: {workspace_id}
- Name: {workspace_name}
- Sector: {workspace_sector}

Extracted RFP Requirements & Compliance Checklist:
{requirements_text}

Retrieved Company Capabilities & Evidence (RAG matches from Capability Library):
{evidence_text}

Please generate the response and/or draft based on the above information. Respond strictly in JSON format."""

    messages = [{"role": "user", "content": prompt}]
    
    try:
        from services.compliance_service import call_llm, clean_json_text
        response_text = call_llm(client, provider, model, system_prompt, messages)
        cleaned_text = clean_json_text(response_text)
        try:
            result_json = json.loads(cleaned_text, strict=False)
            return result_json
        except Exception as json_err:
            import re
            match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if match:
                return json.loads(match.group(0), strict=False)
            raise json_err
    except Exception as e:
        print(f"Error calling LLM in Co-Pilot: {e}")
        return {
            "response": f"I encountered an error processing the request: {str(e)}",
            "draft": None,
            "citations": [],
            "sources": []
        }


