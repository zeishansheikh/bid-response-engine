import os
import time
import shutil
import uuid
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

class ScoreRequest(BaseModel):
    rfp_budget: float
    competitor_count: int

app = FastAPI(title="AI-Powered Bid & Proposal Response Engine")

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

@app.post("/workspaces/{workspace_id}/upload")
def upload_rfp_document(workspace_id: str, file: UploadFile = File(...)):
    # Verify workspace exists
    ws = execute_query("SELECT id FROM workspaces WHERE id = %s;", (workspace_id,), fetch=True)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
        
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".pdf", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
        
    # Generate unique filename to avoid conflicts
    unique_filename = f"{uuid.uuid4()}{file_ext}"
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
        raise HTTPException(status_code=404, detail="No RFP document uploaded for this workspace.")
        
    raw_text = doc[0]["raw_text"]
    
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
            for c in criteria:
                cur.execute(
                    """
                    INSERT INTO evaluation_criteria (workspace_id, criterion_name, weight_pct)
                    VALUES (%s, %s, %s);
                    """,
                    (workspace_id, c.get("name"), c.get("weight_pct"))
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
            return extracted_data
            
        except Exception as db_err:
            conn.rollback()
            raise db_err
        finally:
            cur.close()
            conn.close()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

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
    )
    
    # 3. Fetch all qa_sections for the workspace
    qa_sections = execute_query(
        "SELECT id, question_text, section_order FROM qa_sections WHERE workspace_id = %s;",
        (workspace_id,),
        fetch=True
    )
    
    provider = os.getenv("LLM_PROVIDER", "anthropic").lower()
    
    try:
        # Clear existing matches and drafts
        execute_query("DELETE FROM compliance_checklist WHERE workspace_id = %s;", (workspace_id,))
        execute_query("DELETE FROM draft_sections WHERE workspace_id = %s;", (workspace_id,))
        
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
                
        return {"message": "Capabilities matched and drafts generated successfully."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match capabilities failed: {str(e)}")

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
    checklist = execute_query(query, (workspace_id,), fetch=True)
    
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
    
    sector = ws[0]["sector"]
    
    try:
        # 1. Fetch capability library
        capability_library = execute_query(
            "SELECT sector, contract_value FROM capability_library;",
            fetch=True
        )
        
        # 2. Fetch historical bids
        historical_bids = execute_query(
            "SELECT sector, won FROM historical_bids;",
            fetch=True
        )
        
        # 3. Fetch checklist
        query_checklist = """
            SELECT c.id, c.workspace_id, c.requirement_id, c.match_status, c.confidence_score, c.evidence_capability_id, c.manager_override,
                   r.requirement_text, r.category, r.source_page
            FROM compliance_checklist c
            JOIN requirements r ON c.requirement_id = r.id
            WHERE c.workspace_id = %s;
        """
        checklist = execute_query(query_checklist, (workspace_id,), fetch=True)
        
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
