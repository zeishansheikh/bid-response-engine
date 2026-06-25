import os
import json
import time
import anthropic
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

MATCHING_SYSTEM_PROMPT = """You are a senior bid compliance analyst. You will evaluate whether a company's past work satisfies a given tender requirement based on the provided evidence. Return ONLY a valid JSON object matching the requested schema. Do not output any markdown code blocks, comments, or explanations outside the JSON."""

MATCHING_PROMPT_TEMPLATE = """Evaluate whether the company's past work satisfies this tender requirement.

Requirement: {requirement_text}

Evidence (top matches from capability library):
{evidence_text}

Return JSON only:
{{
  "match_status": "matched" | "partial" | "gap",
  "confidence": number 0-1,
  "evidence_chunk_index": number (1-5 or null),
  "draft_paragraph": string or null
}}

Rules:
- "matched": confidence >= 0.7 and a chunk directly addresses the requirement.
- "partial": confidence between 0.4 and 0.7.
- "gap": confidence < 0.4 or no relevant chunk.
- draft_paragraph only if matched/partial. 2-4 sentences, proposal-ready, citing specific evidence. Never invent facts.
- evidence_chunk_index: specify the 1-based index (1 to 5) of the evidence chunk that contains the best supporting details. If status is "gap", return null."""

def clean_json_text(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text

def call_llm(client, provider: str, model: str, system_prompt: str, messages: list) -> str:
    if provider == "groq":
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
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text

def evaluate_requirement(requirement_text: str, matches: list[dict]) -> dict:
    provider = os.getenv("LLM_PROVIDER", "anthropic").lower()
    model = os.getenv("LLM_MODEL", "claude-sonnet-4-6")
    
    if provider == "groq":
        client = Groq()
    else:
        client = anthropic.Anthropic()
        
    evidence_lines = []
    for idx, match in enumerate(matches, 1):
        evidence_lines.append(f"Chunk {idx}: {match['chunk_text']}")
    evidence_text = "\n".join(evidence_lines) if evidence_lines else "No evidence available."
    
    prompt = MATCHING_PROMPT_TEMPLATE.format(
        requirement_text=requirement_text,
        evidence_text=evidence_text
    )
    
    messages = [{"role": "user", "content": prompt}]
    response_text = ""
    
    try:
        response_text = call_llm(client, provider, model, MATCHING_SYSTEM_PROMPT, messages)
        cleaned_text = clean_json_text(response_text)
        return json.loads(cleaned_text)
    except Exception as e:
        err_msg = str(e).lower()
        if "429" in err_msg or "rate limit" in err_msg or "tpm" in err_msg or "tpd" in err_msg:
            if provider == "groq" and model == "llama-3.3-70b-versatile":
                print("Daily rate limit/TPD hit on Groq 70B model. Falling back to llama-3.1-8b-instant...")
                model = "llama-3.1-8b-instant"
                try:
                    response_text = call_llm(client, provider, model, MATCHING_SYSTEM_PROMPT, messages)
                    cleaned_text = clean_json_text(response_text)
                    return json.loads(cleaned_text)
                except Exception as retry_err:
                    print(f"Retry with fallback model failed: {retry_err}")
                    raise retry_err
            else:
                print("Rate limit (429) hit! Sleeping 20 seconds before retrying...")
                time.sleep(20)
                try:
                    response_text = call_llm(client, provider, model, MATCHING_SYSTEM_PROMPT, messages)
                    cleaned_text = clean_json_text(response_text)
                    return json.loads(cleaned_text)
                except Exception as retry_err:
                    print(f"Retry after rate limit failed: {retry_err}")
                    raise retry_err
        else:
            print(f"Compliance evaluation failed with error: {e}. Retrying once with help...")
            time.sleep(2)
            messages.append({"role": "assistant", "content": response_text})
            messages.append({
                "role": "user",
                "content": f"JSON parsing failed with error: {e}. Please correct it and output ONLY a valid JSON object matching the schema."
            })
            retry_text = call_llm(client, provider, model, MATCHING_SYSTEM_PROMPT, messages)
            cleaned_retry_text = clean_json_text(retry_text)
            return json.loads(cleaned_retry_text)

