# 🚀 AI Broadcast Call Agent (MVP)

A streamlined, highly-optimized Minimum Viable Product (MVP) for executing automated outbound voice broadcasting campaigns. This system reads directly from a user-provided script and automatically dials phone numbers from an Excel sheet to deliver high-quality, ultra-realistic voice messages using ElevenLabs.

It is designed to be **100% rigid**—it does not use an LLM to hallucinate or invent conversations. It strictly reads the exact script provided for zero-latency, flawless execution.

> **Note:** This repository has been optimized for low space and time complexity. All legacy, unused, and heavy TTS/STT dependencies (like Edge-TTS or Piper models) have been purged.

---

## ✨ Features
* **Zero-Hallucination Execution:** Bypasses LLMs entirely. Operates solely as a reliable text-to-speech executor based on explicit human scripts.
* **Auto-Dialer Engine:** Upload an `.xlsx` list of contacts and the system automatically coordinates dialing them one-by-one.
* **ElevenLabs Integration:** Uses the industry-leading `eleven_multilingual_v2` model (Bella Voice) customized heavily for high-fidelity Hinglish and English rendering.
* **Global CDN Audio Delivery:** Once the audio byte-stream is generated, it is instantly uploaded to the `Catbox.moe` global CDN. This prevents webhook drops out of local tunnels and guarantees maximum Twilio streaming stability.
* **Twilio Webhook Integration:** Directly triggers TwiML `<Play>` verb instructions to execute the automated broadcast seamlessly.

---

## 🏗️ Architecture Stack
* **Frontend:** React.js, Tailwind CSS *(Web Dashboard)*
* **Backend:** FastAPI (Python), Uvicorn, HTTPX
* **Voice Engine:** ElevenLabs API V1 (`eleven_multilingual_v2`)
* **Call Routing:** Twilio API
* **CDN Hosting:** Catbox.moe CDN (Static MP3 streaming)

---

## ⚙️ Setup & Installation

### Prerequisites
* Python 3.9+
* Node.js & npm
* A Twilio Account SID & Auth Token
* An ElevenLabs API Key

### 1. Backend Setup (FastAPI)
Open a terminal and navigate to the `/backend` directory:
```bash
cd backend

# Create and activate a Virtual Environment
python -m venv venv
.\venv\Scripts\activate  # On Windows
# source venv/bin/activate # On Mac/Linux

# Install requirements
pip install fastapi uvicorn pandas openpyxl requests httpx twilio python-dotenv

# Create environment variable file
echo "ELEVENLABS_API_KEY=sk_your_api_key_here" > .env
```
Run the local backend server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup (React)
Open a new terminal and navigate to the `/frontend` directory:
```bash
cd frontend

# Install dependencies
npm install

# Start the dashboard
npm start
```
The application dashboard will run locally at `http://localhost:3000`.

---

## 🛠️ How it Works
1. You upload a `customers.xlsx` file containing a `Name` and a `Phone` column.
2. You provide a script text (e.g., Hinglish for Indian targeting) in the **Campaign Theme** box. 
   *(Note: The string `{name}` can be typed anywhere in the script to automatically inject the customer's name from the Excel sheet into the exact text before speaking!)*
3. When you start the campaign, React signals `/start-call` on the FastAPI backend.
4. FastAPI formats the exact text string, requests the raw MP3 byte data from **ElevenLabs**, and seamlessly uploads it to the **Catbox CDN**.
5. FastAPI triggers **Twilio** to dial the customer's phone number, providing TwiML instructions to stream the MP3 file globally from the CDN.
6. Twilio formally hangs up automatically after exactly executing the `<Play>` tag.

---

## 🔒 Security
All sensitive environment variables, such as `ELEVENLABS_API_KEY`, have been relocated securely into a local `.env` file. A `.gitignore` has been provided which restricts the tracking of `node_modules`, `venv`, `__pycache__`, and `.env` files to keep this Github Repository production-secure and perfectly lightweight.
