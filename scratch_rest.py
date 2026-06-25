import os
import requests
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
anon_key = os.getenv("SUPABASE_ANON_KEY")

headers = {
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}"
}

print(f"Testing Supabase REST API at {supabase_url}...")

# 1. Get capability_library
try:
    url = f"{supabase_url}/rest/v1/capability_library?select=*"
    res = requests.get(url, headers=headers)
    print("GET capability_library status:", res.status_code)
    print("Response:", res.text[:200])
except Exception as e:
    print("Error:", e)

# 2. Get workspaces
try:
    url = f"{supabase_url}/rest/v1/workspaces?select=*"
    res = requests.get(url, headers=headers)
    print("GET workspaces status:", res.status_code)
    print("Response:", res.text[:200])
except Exception as e:
    print("Error:", e)
