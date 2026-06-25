from sentence_transformers import SentenceTransformer
from database import execute_query

print("Loading sentence-transformers/all-MiniLM-L6-v2 model in rag_service...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def embed_text(text: str) -> list[float]:
    return embedder.encode(text).tolist()

def retrieve_top_matches(requirement_text: str, conn=None, top_k: int = 5) -> list[dict]:
    qe = embed_text(requirement_text)
    
    query = """
        SELECT capability_id, chunk_text, 1 - (embedding <=> %s) AS similarity
        FROM capability_embeddings
        ORDER BY embedding <=> %s
        LIMIT %s;
    """
    rows = execute_query(query, (str(qe), str(qe), top_k), fetch=True)
    
    results = []
    if rows:
        for r in rows:
            results.append({
                "capability_id": str(r["capability_id"]),
                "chunk_text": r["chunk_text"],
                "similarity": float(r["similarity"])
            })
    return results
