from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)

load_dotenv()

AI_AGENT = os.getenv("AI_AGENT", "dummy")

app = FastAPI(title="AI Code Optimizer Backend - Phase 1")

# Models
class CodeRequest(BaseModel):
    code: str

class AgentSwitchRequest(BaseModel):
    agent: str

#Endpoints
@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}

@app.post("/optimize")
def optimize_code(req: CodeRequest):
    return {"optimized_code": f"// optimized version of:\n{req.code}"}

@app.post("/debug")
def debug_code(req: CodeRequest):
    return {"debugged_code": f"// fixed version of:\n{req.code}"}

@app.post("/run")
def run_code(req: CodeRequest):
    # Dummy output
    return {"output": "Hello World", "error": None, "runtime_ms": 10}

@app.get("/metrics")
def get_metrics():
    return {"energy_kwh": 0.01, "co2_g": 5}

@app.post("/agent/switch")
def switch_agent(req: AgentSwitchRequest):
    return {"status": "success", "agent": req.agent}

# WebSocket for streaming updates
@app.websocket("/stream")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    await ws.send_text("tokenizing...")
    await ws.send_text("analyzing code...")
    await ws.send_text("applying fixes...")
    await ws.send_text("done ✅")
    await ws.close()
    