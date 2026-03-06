import requests
import time

# 1. PASTE YOUR KEY HERE (Copy from your Dashboard Modal)
TEAM_KEY = "sk_f5dee97e16f04657" 
BASE_URL = "http://localhost:8000"

def simulate_ai_call():
    print(f"🚀 Sending AI request for team: {TEAM_KEY}")
    
    payload = {
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": "Explain quantum computing like I'm five."}]
    }
    
    headers = {
        "x-team-key": TEAM_KEY,
        "Content-Type": "application/json"
    }

    try:
        # We call our PROXY endpoint, not OpenAI directly!
        response = requests.post(f"{BASE_URL}/proxy/chat", json=payload, headers=headers)
        
        if response.status_code == 200:
            print("✅ Success! Dashboard should update shortly.")
            print(f"Data: {response.json().get('usage')}")
        else:
            print(f"❌ Failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"⚠️ Error connecting to backend: {e}")

if __name__ == "__main__":
    # Simulate 3 calls
    for i in range(3):
        simulate_ai_call()
        time.sleep(1) # Small gap