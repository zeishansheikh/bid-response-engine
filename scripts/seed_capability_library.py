import os
import sys
import csv
import re

# Resolve module paths
sys.path.append('d:/Bid')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sentence_transformers import SentenceTransformer
from database import execute_query

# Load embedding model
print("Loading sentence-transformers/all-MiniLM-L6-v2 model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def chunk_text(text: str, chunk_size: int = 300) -> list[str]:
    words = text.split()
    if not words:
        return []
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunks.append(" ".join(words[i:i + chunk_size]))
    return chunks

def parse_contract_value(val_str: str) -> float | None:
    if not val_str:
        return None
    val_str = val_str.strip()
    match = re.match(r"PKR\s*(\d+)M", val_str, re.IGNORECASE)
    if match:
        return float(match.group(1)) * 1_000_000.0
    try:
        cleaned = re.sub(r"[^\d.]", "", val_str)
        return float(cleaned) if cleaned else None
    except ValueError:
        return None

def seed():
    try:
        # Clear existing data
        print("Clearing existing capability data...")
        execute_query("TRUNCATE TABLE capability_library CASCADE;")
        
        # Load CSV
        csv_path = "capability_library_seed_50.csv"
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Could not find {csv_path}")
            
        print("Reading CSV data and inserting into DB...")
        with open(csv_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            records = list(reader)
            
        print(f"Found {len(records)} records in CSV. Seeding...")
        for i, row in enumerate(records, 1):
            cap_id = row["Cap ID"]
            sector = row["Domain"]
            summary_text = row["Project Summary"]
            certification = row["Certification"]
            if certification in ("N/A", "none", "None", ""):
                certification = None
                
            year_completed = int(row["Year Completed"]) if row["Year Completed"] else None
            contract_value = parse_contract_value(row["Contract Value"])
            duration_months = int(row["Duration (months)"]) if row["Duration (months)"] else None
            client_type = row["Client Type"] if row["Client Type"] else None
            
            # Extract project title from summary (e.g. "Project 1" from "Project 1: ...")
            if ":" in summary_text:
                project_title = summary_text.split(":", 1)[0].strip()
            else:
                project_title = cap_id
                
            # Insert into capability_library
            res = execute_query(
                """
                INSERT INTO capability_library 
                (project_title, sector, certification, year_completed, contract_value, duration_months, client_type, summary_text)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
                """,
                (project_title, sector, certification, year_completed, contract_value, duration_months, client_type, summary_text),
                fetch=True
            )
            if not res:
                raise RuntimeError(f"Failed to insert capability record {i}")
            capability_id = res[0]["id"]
            
            # Chunk summary_text
            chunks = chunk_text(summary_text, chunk_size=300)
            
            # Embed and insert chunks
            for chunk in chunks:
                embedding = embedder.encode(chunk).tolist()
                execute_query(
                    """
                    INSERT INTO capability_embeddings (capability_id, chunk_text, embedding)
                    VALUES (%s, %s, %s);
                    """,
                    (capability_id, chunk, str(embedding))
                )
                
            if i % 10 == 0:
                print(f"  Processed {i}/50 records...")
                
        print("Seeding completed successfully!")
        
        # Verify row counts
        lib_count = execute_query("SELECT COUNT(*) FROM capability_library;", fetch=True)[0]["count"]
        emb_count = execute_query("SELECT COUNT(*) FROM capability_embeddings;", fetch=True)[0]["count"]
        
        print("\n--- Final Row Counts ---")
        print(f"capability_library: {lib_count}")
        print(f"capability_embeddings: {emb_count}")
        
    except Exception as e:
        print("Error seeding database:", e)
        raise e

if __name__ == "__main__":
    seed()
