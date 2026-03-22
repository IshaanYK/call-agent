import asyncio
import io
import os
import re
import subprocess
import threading
import uuid
import html
import time
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

import httpx
import pandas as pd
import requests
from fastapi import FastAPI, Form, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from twilio.rest import Client

# ====== GLOBALS ======
app = FastAPI()
conversations = {}
call_data = {}
current_campaign_theme = "Innovate AI service"
public_url = ""

OPENROUTER_API_KEY = "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"
TWILIO_ACCOUNT_SID = "AC124df577479e2ead3fee12d67448ba89"
TWILIO_AUTH_TOKEN = "7d6d6618ba0e1434de41a86a2aa080af"
TWILIO_PHONE_NUMBER = "+13374150493"
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
# Secure key retrieval for GitHub repository safety
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# ====== EXTERNAL TUNNEL (.env) ======
public_url = os.getenv("BASE_URL", "")

def start_tunnel():
    global public_url
    if public_url:
        print(f"*** USING CUSTOM URL FROM .env: {public_url} ***")
        return
        
    print("Starting Serveo tunnel as fallback...")
    cmd = ["ssh", "-R", "80:localhost:8000", "serveo.net", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30"]
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    for line in process.stdout:
        match = re.search(r'(https://[a-zA-Z0-9-]+\.serveo(?:usercontent\.com|\.net))', line)
        if match:
            public_url = match.group(1)
            print(f"*** TUNNEL ESTABLISHED: {public_url} ***")
            break

# Run pinggy in background if no BASE_URL provided
threading.Thread(target=start_tunnel, daemon=True).start()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== UTILS ======
async def generate_elevenlabs_audio_url(text: str):
    if not ELEVENLABS_API_KEY:
        return ""
    
    # Using 'Bella' Voice ID
    url = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers, timeout=20.0)
            if response.status_code == 200:
                audio_bytes = response.content
                # Upload to Catbox
                res = requests.post("https://catbox.moe/user/api.php", 
                    files={"reqtype": (None, "fileupload"), "fileToUpload": ("audio.mp3", audio_bytes, "audio/mpeg")}
                )
                return res.text.strip()
            else:
                print("ElevenLabs Error:", response.text)
                return ""
    except Exception as e:
        print("ElevenLabs / Catbox Exception:", e)
        return ""

# ====== ENDPOINTS ======
@app.get("/")
def home():
    return {"message": "AI Call Agent Backend Running"}

@app.post("/upload-campaign")
async def upload_campaign(file: UploadFile, theme: str = Form("Innovate AI service")):
    global current_campaign_theme
    current_campaign_theme = theme
    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
    calls = []
    for _, row in df.iterrows():
        call_id = str(uuid.uuid4())
        name = str(row.get("Name","Unknown"))
        phone = str(row.get("Phone", row.get("Number", "")))
        call_data[call_id] = {"name": name, "theme": theme, "phone": phone}
        calls.append({"id": call_id, "name": name, "phone": phone, "status": "pending"})
    return {"calls": calls}

class StartCallRequest(BaseModel):
    call_id: str

@app.post("/start-call")
async def start_call(req: StartCallRequest):
    call_info = call_data.get(req.call_id, {"name": "there", "theme": current_campaign_theme, "phone": ""})
    name = call_info["name"]
    theme = call_info["theme"]
    phone = call_info.get("phone", "")

    # Ensure it's the exact literal script, ignoring previously injected name variables.
    first_message = theme.strip()
    
    # If the script is empty or missing, return a fallback message
    if not first_message:
        first_message = "No script provided"

    try:
        if phone:
            retries = 0
            while not public_url and retries < 10:
                time.sleep(1)
                retries += 1
                
            formatted_phone = phone if phone.startswith("+") else f"+{phone}"
            
            # Use ElevenLabs if configured, else fallback to Twilio Polly Aditi (Hindi)
            audio_url = await generate_elevenlabs_audio_url(first_message)
            
            if audio_url:
                twiml_block = f'''<Response>
                    <Pause length="1"/>
                    <Play>{audio_url}</Play>
                    <Pause length="1"/>
                    <Hangup/>
                </Response>'''
            else:
                twiml_block = f'''<Response>
                    <Pause length="1"/>
                    <Say voice="Polly.Aditi" language="hi-IN">{html.escape(first_message)}</Say>
                    <Pause length="1"/>
                    <Hangup/>
                </Response>'''
            
            call = twilio_client.calls.create(to=formatted_phone, from_=TWILIO_PHONE_NUMBER, twiml=twiml_block)
            print(f"Dialing {formatted_phone} via Twilio, SID: {call.sid}")
            return {"reply": first_message, "phone": phone, "sid": call.sid}
    except Exception as e:
        print("Twilio Dial Error:", e)

    return {"reply": first_message, "phone": phone}

@app.get("/call-status/{sid}")
async def get_call_status(sid: str):
    try:
        call = twilio_client.calls(sid).fetch()
        return {"status": call.status}
    except Exception as e:
        return {"status": "error"}