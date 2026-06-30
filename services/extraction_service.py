import os
import json
import time
import anthropic
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

EXTRACTION_SYSTEM_PROMPT = """You are a senior bid compliance analyst. You will be given a portion of the text of a tender/RFP/RFQ document. Return ONLY a valid JSON object — no markdown, no commentary.

Schema:
{
  "submission_deadline": "YYYY-MM-DD or YYYY-MM-DD HH:MM, or null",
  "budget_figures": [{"label": "string", "amount_pkr": number or null, "raw_text": "string"}],
  "evaluation_criteria": [{"name": "string", "weight_pct": number or null}],
  "mandatory_requirements": [{"text": "string", "category": "technical|financial|legal|experience|certification|other", "page": number or null}],
  "qa_sections": [{"question": "string", "order": number or null}]
}

Rules:
- Capture every clause with "must", "shall", "required", "mandatory", "minimum" as a mandatory_requirement.
- Missing field -> null or empty array, never omit the key.
- Output nothing except the JSON object."""

def clean_json_text(text: str) -> str:
    """Strips markdown code block backticks if present."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text

def split_text_in_half(text: str) -> list[str]:
    """Splits the raw text into two roughly equal halves at a newline boundary."""
    mid = len(text) // 2
    split_pos = text.find("\n", mid)
    if split_pos == -1:
        split_pos = text.find(" ", mid)
    if split_pos == -1:
        split_pos = mid
        
    part1 = text[:split_pos].strip()
    part2 = text[split_pos:].strip()
    return [part1, part2]

def merge_extractions(extractions: list[dict]) -> dict:
    """Merges and deduplicates multiple extraction results."""
    merged = {
        "submission_deadline": None,
        "budget_figures": [],
        "evaluation_criteria": [],
        "mandatory_requirements": [],
        "qa_sections": []
    }
    
    seen_budgets = set()
    seen_criteria = set()
    seen_requirements = set()
    seen_qa = set()
    
    for ext in extractions:
        if not isinstance(ext, dict):
            continue
            
        # 1. Deadline
        if ext.get("submission_deadline") and not merged["submission_deadline"]:
            merged["submission_deadline"] = ext["submission_deadline"]
            
        # 2. Budgets
        for b in ext.get("budget_figures", []):
            if not isinstance(b, dict):
                continue
            lbl = b.get("label")
            amt = b.get("amount_pkr")
            key = (lbl, amt)
            if key not in seen_budgets:
                seen_budgets.add(key)
                merged["budget_figures"].append(b)
                
        # 3. Evaluation Criteria
        for c in ext.get("evaluation_criteria", []):
            if not isinstance(c, dict):
                continue
            name = c.get("name")
            if name and name not in seen_criteria:
                seen_criteria.add(name)
                merged["evaluation_criteria"].append(c)
                
        # 4. Mandatory Requirements
        for r in ext.get("mandatory_requirements", []):
            if not isinstance(r, dict):
                continue
            text_val = r.get("text")
            if text_val and text_val not in seen_requirements:
                seen_requirements.add(text_val)
                merged["mandatory_requirements"].append(r)
                
        # 5. QA Sections
        for q in ext.get("qa_sections", []):
            if not isinstance(q, dict):
                continue
            question = q.get("question")
            if question and question not in seen_qa:
                seen_qa.add(question)
                merged["qa_sections"].append(q)
                
    # Sort QA sections by order if order is present
    merged["qa_sections"] = sorted(merged["qa_sections"], key=lambda x: x.get("order") if x.get("order") is not None else 0)
    
    return merged

def call_llm(client, provider: str, model: str, system_prompt: str, messages: list) -> str:
    """Helper to make the API call to Anthropic or Groq."""
    if provider == "groq":
        # System prompt is passed in the messages list for ChatCompletions
        full_messages = [{"role": "system", "content": system_prompt}] + messages
        response = client.chat.completions.create(
            model=model,
            messages=full_messages,
            temperature=0.0
        )
        return response.choices[0].message.content
    else:
        response = client.messages.create(
            model=model,
            max_tokens=4096,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text

def extract_single_chunk(raw_text: str, provider: str, model: str, client) -> dict:
    """Extracts structure from a single chunk of text, retrying once on JSON error."""
    messages = [{"role": "user", "content": raw_text}]
    response_text = ""
    
    try:
        response_text = call_llm(client, provider, model, EXTRACTION_SYSTEM_PROMPT, messages)
        cleaned_text = clean_json_text(response_text)
        result = json.loads(cleaned_text)
        print(f"[DEBUG] Raw evaluation_criteria from LLM: {result.get('evaluation_criteria')}")
        return result
    except (json.JSONDecodeError, Exception) as e:
        print(f"First extraction attempt failed: {e}. Retrying once...")
        time.sleep(2)  # brief wait before retry
        
        # Append the failed output and error as context
        messages.append({"role": "assistant", "content": response_text})
        messages.append({
            "role": "user",
            "content": f"JSON parsing failed with error: {e}. Please correct it and output ONLY a valid JSON object matching the schema."
        })
        
        retry_text = call_llm(client, provider, model, EXTRACTION_SYSTEM_PROMPT, messages)
        cleaned_retry_text = clean_json_text(retry_text)
        result = json.loads(cleaned_retry_text)
        print(f"[DEBUG] Raw evaluation_criteria from LLM (retry): {result.get('evaluation_criteria')}")
        return result

def extract_rfp_structure(raw_text: str) -> dict:
    provider = os.getenv("LLM_PROVIDER", "anthropic").lower()
    model = os.getenv("LLM_MODEL", "claude-sonnet-4-6")
    
    if provider == "groq":
        client = Groq()
    else:
        client = anthropic.Anthropic()
        
    # If the provider is Groq and text size is large, split into 2 halves to avoid TPM rate limits
    if provider == "groq" and len(raw_text) > 25000:
        print(f"Document text length is {len(raw_text)} chars. Splitting into 2 chunks to stay under Groq TPM limit...")
        chunks = split_text_in_half(raw_text)
        results = []
        for idx, chunk in enumerate(chunks, 1):
            if idx > 1:
                # Sleep to allow the TPM window to decay
                print("Sleeping 20 seconds to prevent rate limit limits...")
                time.sleep(20)
            print(f"Processing chunk {idx}/2 ({len(chunk)} chars)...")
            res = extract_single_chunk(chunk, provider, model, client)
            results.append(res)
        merged = merge_extractions(results)
        return merged
    else:
        print(f"Processing single chunk ({len(raw_text)} chars)...")
        return extract_single_chunk(raw_text, provider, model, client)
