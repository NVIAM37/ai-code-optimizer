# AI Code Optimizer – Phase 1

Welcome to **AI Code Optimizer** – Phase 1. This project sets up the foundation of a VS Code extension integrated with a FastAPI backend, a dummy AI adapter, and a sandbox runtime. This README outlines the Phase 1 chunks, goals, teams, steps, and deliverables.

---

## 📌 Phase 1 Chunks

| Chunk | Goal | Team / Leader | Key Steps | Deliverable |
|-------|------|---------------|-----------|-------------|
| **1 – VS Code Extension (Frontend)** | Extension skeleton + UI | Vanshika (UI), Charan (Setup) | Scaffold extension, add commands, WebView UI (dummy tabs), Status bar, Settings panel, ESLint + Prettier | `.vsix` installed in VS Code with dummy UI |
| **2 – Backend Service (FastAPI, MCP-lite)** | Backend brain | Diksha (Endpoints), Nishant (WebSocket + Logging), Kaivalya (Helper) | Create FastAPI project, endpoints `/optimize`, `/debug`, `/run`, `/metrics`, `/agent/switch`, WebSocket `/stream`, store API keys & agent configs, basic logging | Local backend returning dummy JSON |
| **3 – Extension ↔ Backend Connection** | Connect UI with backend | Lokesh | Capture code, send fetch requests, parse JSON, display results in WebView, connect WebSocket, auto-reconnect | End-to-end demo: Extension → Backend → WebView |
| **4 – AI Integration (Dummy + Adapter)** | Dummy AI now, real AI later | Fiza | `dummy_adapter.py` with optimize/debug functions, `openai_adapter.py` setup, adapter manager to switch, prompt templates, error handling | Extension can call dummy AI; Phase 2 ready for real AI |
| **5 – Sandbox Runtime** | Safe code execution | Lokesh + Sneha | Use `subprocess.run()`, add timeout, capture stdout/stderr → return JSON, restrict environment | `/run` endpoint executes code safely |
| **6 – Energy Metrics (Dummy)** | Show environmental impact | Harsh | Backend `/metrics` returns dummy energy values, display in Metrics tab, placeholder for real integration | Metrics tab shows eco-impact values |
| **7 – CI/CD (Basic First)** | Automate lint, tests, build | Lokesh (Leader), Tharuna, Charan | ESLint + Prettier (extension), Flake8 (backend), Jest + Pytest, GitHub Actions workflow, document workflow | Automatic lint + tests + `.vsix` build artifact |
| **8 – Internal Testing & Deploy** | Validate end-to-end system | Everyone | Install `.vsix`, run commands, check backend responses, test WebSocket, log issues & fix | Fully working Phase 1 prototype |

---

## ⚠️ Notes

- All detailed info about **which folder to work in** and team assignments can be found in the **`data/team.md`** file.  
- A list of available **AI tools** is maintained in **`data/ai_tools.md`**.  
- References for frontend components are also available in the **`data/` folder**.  
- Weekly progress and changes should be tracked in **`changelog.md`**.  
- Phase 1 is a prototype; all AI calls and metrics are dummy.  
- Sandbox is limited to safe code execution; Docker will be added in Phase 2.  

---

## ✅ Deliverables

- VS Code extension (`.vsix`) with dummy UI (Chunk 1)  
- FastAPI backend with dummy responses (Chunk 2)  
- Extension ↔ backend communication setup (Chunk 3)  
- Dummy AI adapters ready for Phase 2 (Chunk 4)  
- Safe code execution (`/run`) (Chunk 5)  
- Metrics display with dummy environmental impact (Chunk 6)  
- CI/CD workflow for linting, testing, and building (Chunk 7)  
- Internal testing & validation of end-to-end flow (Chunk 8)  
