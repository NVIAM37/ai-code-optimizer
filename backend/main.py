from fastapi import FastAPI, WebSocket,Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import logging
from datetime import datetime



# Always use absolute path (avoid __file__ issues in reload)
os.makedirs(os.path.join(os.path.dirname(__file__), "logs"), exist_ok=True)
log_file_path = os.path.join(os.path.dirname(__file__), "logs", "backend.log")

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file_path),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("backend_logger")
logger.info("Logger initialized")

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
    logger.info(f"/ called at {datetime.now().isoformat()}")
    return {"message": "Backend is running 🚀"}

@app.post("/optimize")
def optimize_code(req: CodeRequest):
    logger.info(f"/optimize called at {datetime.now().isoformat()}")
    return {"optimized_code": f"// optimized version of:\n{req.code}"}

@app.post("/debug")
def debug_code(req: CodeRequest):
    logger.info(f"/debug called at {datetime.now().isoformat()}")
    return {"debugged_code": f"// fixed version of:\n{req.code}"}

@app.post("/run")
def run_code(req: CodeRequest):
    # Dummy output
    logger.info(f"/run called at {datetime.now().isoformat()}")
    return {"output": "Hello World", "error": None, "runtime_ms": 10}

@app.get("/metrics")
def get_metrics():
    logger.info(f"/metrics called at {datetime.now().isoformat()}")
    return {"energy_kwh": 0.01, "co2_g": 5}

@app.post("/agent/switch")
def switch_agent(req: AgentSwitchRequest):
    logger.info(f"/agent/switch called at {datetime.now().isoformat()} with agent={req.agent}")
    return {"status": "success", "agent": req.agent}


# WebSocket for streaming updates
@app.websocket("/stream")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    logger.info(f"WebSocket connection established at {datetime.now().isoformat()}")
    try:
        await ws.send_text("tokenizing...")
        await ws.send_text("analyzing code...")
        await ws.send_text("applying fixes...")
        await ws.send_text("done ✅")
        logger.info(f"WebSocket processing completed at {datetime.now().isoformat()}")
    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")
    finally:
        await ws.close()
        logger.info(f"WebSocket connection closed at {datetime.now().isoformat()}")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Error in {request.url.path}: {str(e)}")
        return JSONResponse(status_code=500, content={"error": "Internal Server Error"})
    