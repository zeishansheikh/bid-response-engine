import os
import json
from fastapi.testclient import TestClient
from main import app
from database import execute_query

client = TestClient(app)

def run_integration_test():
    print("--- Starting Integration Test ---")
    
    # 1. Create Workspace
    print("\n1. Creating workspace...")
    ws_response = client.post(
        "/workspaces",
        json={"name": "GFS Enterprise Cloud Migration Test", "sector": "Financial"}
    )
    print(f"Status: {ws_response.status_code}")
    assert ws_response.status_code == 200, "Workspace creation failed"
    workspace = ws_response.json()
    workspace_id = workspace["id"]
    print(f"Created Workspace ID: {workspace_id}")
    
    # 2. Upload RFP Document
    print("\n2. Uploading RFP document sample_rfp_1.pdf...")
    pdf_path = "sample_rfp_1.pdf"
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found in workspace!")
        return
        
    with open(pdf_path, "rb") as f:
        upload_response = client.post(
            f"/workspaces/{workspace_id}/upload",
            files={"file": (pdf_path, f, "application/pdf")}
        )
    print(f"Status: {upload_response.status_code}")
    assert upload_response.status_code == 200, "Upload failed"
    print(upload_response.json()["message"])
    
    # 3. Trigger Extraction
    print("\n3. Triggering LLM extraction (splits and sleeps to avoid Groq rate limits)...")
    extract_response = client.post(f"/workspaces/{workspace_id}/extract")
    print(f"Status: {extract_response.status_code}")
    assert extract_response.status_code == 200, "Extraction failed"
    
    extracted_data = extract_response.json()
    print("\nExtraction Success! Saved to Database.")
    
    # 4. Verify DB Row Counts
    print("\n4. Verifying DB row counts...")
    reqs_count = execute_query("SELECT COUNT(*) FROM requirements WHERE workspace_id = %s;", (workspace_id,), fetch=True)[0]["count"]
    criteria_count = execute_query("SELECT COUNT(*) FROM evaluation_criteria WHERE workspace_id = %s;", (workspace_id,), fetch=True)[0]["count"]
    qa_count = execute_query("SELECT COUNT(*) FROM qa_sections WHERE workspace_id = %s;", (workspace_id,), fetch=True)[0]["count"]
    
    print("-" * 30)
    print(f"Requirements rows: {reqs_count}")
    print(f"Evaluation Criteria rows: {criteria_count}")
    print(f"QA Sections rows: {qa_count}")
    print("-" * 30)
    
    # Save the final API output JSON for visual verification
    with open("api_extraction_output.json", "w", encoding="utf-8") as out:
        json.dump(extracted_data, out, indent=2)
    print("API extraction output saved to api_extraction_output.json")
    
    # Cleanup test workspace from DB to keep DB clean
    print("\n5. Cleaning up test workspace...")
    execute_query("DELETE FROM workspaces WHERE id = %s;", (workspace_id,))
    print("Cleanup completed.")

if __name__ == "__main__":
    run_integration_test()
