# AI Code Optimizer – Phase 1

AI Code Optimizer is a VS Code developer tool designed to streamline coding workflows. Phase 1 establishes the foundation with a VS Code extension, a FastAPI backend, dummy AI adapters, and a sandbox runtime. This README outlines the Phase 1 scope, goals, responsibilities, and deliverables.

---

## Project Overview

- **Extension (Frontend)** → Interactive VS Code extension with commands, settings, and UI.
- **Backend (FastAPI)** → Lightweight service for optimization, debugging, and execution requests.
- **AI Adapters** → Dummy AI integrations now; scalable adapter system for real AI in Phase 2.
- **Sandbox Runtime** → Safe execution environment with restrictions.
- **CI/CD Pipeline** → Automated linting, testing, and build workflows.

---

## Phase 1 Chunks & Responsibilities

**Chunk 1 → VS Code Extension (Frontend)**  
→ **Goal:** Extension skeleton + UI  
→ **Team/Lead:** Vanshika (UI), Charan (Setup)  
→ **Key Steps:** Scaffold extension, add commands, WebView dummy tabs, status bar, settings panel, ESLint + Prettier  
→ **Deliverable:** `.vsix` extension with dummy UI  

**Chunk 2 → Backend Service (FastAPI, MCP-lite)**  
→ **Goal:** Backend foundation  
→ **Team/Lead:** Diksha (Endpoints), Nishant (WebSocket + Logging), Kaivalya (Helper)  
→ **Key Steps:** Create FastAPI app, endpoints (`/optimize`, `/debug`, `/run`, `/metrics`, `/agent/switch`), WebSocket `/stream`, API key storage, basic logging  
→ **Deliverable:** Local backend returning dummy JSON  

**Chunk 3 → Extension ↔ Backend Connection**  
→ **Goal:** Connect frontend with backend  
→ **Team/Lead:** Lokesh  
→ **Key Steps:** Capture code, send fetch requests, parse JSON, display results in WebView, WebSocket auto-reconnect  
→ **Deliverable:** End-to-end demo (Extension → Backend → WebView)  

**Chunk 4 → AI Integration (Dummy + Adapter)**  
→ **Goal:** Adapter layer  
→ **Team/Lead:** Fiza  
→ **Key Steps:** Implement `dummy_adapter.py`, setup `openai_adapter.py`, adapter manager, prompt templates, error handling  
→ **Deliverable:** Extension can call dummy AI; Phase 2 ready for real AI  

**Chunk 5 → Sandbox Runtime**  
→ **Goal:** Safe code execution  
→ **Team/Lead:** Lokesh + Sneha  
→ **Key Steps:** Use `subprocess.run()` with timeout, capture stdout/stderr, return JSON, restricted environment  
→ **Deliverable:** `/run` endpoint executes code safely  

**Chunk 6 → Energy Metrics (Dummy)**  
→ **Goal:** Environmental impact tracking  
→ **Team/Lead:** Harsh  
→ **Key Steps:** Backend `/metrics` returns dummy values, display in Metrics tab  
→ **Deliverable:** Metrics tab displays eco-impact  

**Chunk 7 → CI/CD (Basic)**  
→ **Goal:** Automated build + testing  
→ **Team/Lead:** Lokesh (Lead), Tharuna, Charan  
→ **Key Steps:** ESLint + Prettier, Flake8, Jest, Pytest, GitHub Actions workflow  
→ **Deliverable:** Lint + tests + `.vsix` build artifact  

**Chunk 8 → Internal Testing & Deployment**  
→ **Goal:** End-to-end validation  
→ **Team/Lead:** Everyone  
→ **Key Steps:** Install `.vsix`, run commands, test backend + WebSocket, log issues and fix  
→ **Deliverable:** Fully working Phase 1 prototype  

---

## Notes

- Detailed folder structure & team assignments: `data/team.md`  
- List of AI tools: `data/ai_tools.md`  
- Frontend references: `data/` folder  
- Weekly progress and changes should be tracked in `changelog.md`  
- Phase 1 uses **dummy AI + dummy metrics**  
- Sandbox supports safe execution only (Docker planned in Phase 2)  

---

## Phase 1 Deliverables

→ VS Code extension (`.vsix`) with dummy UI (Chunk 1)  
→ FastAPI backend with dummy responses (Chunk 2)  
→ Extension ↔ Backend communication setup (Chunk 3)  
→ Dummy AI adapters ready for Phase 2 (Chunk 4)  
→ Safe code execution runtime (`/run`) (Chunk 5)  
→ Metrics tab with dummy eco-impact values (Chunk 6)  
→ CI/CD pipeline for linting, testing, and building (Chunk 7)  
→ End-to-end prototype validation (Chunk 8)  

---

## Next Steps

→ Replace dummy AI adapter with real AI integrations (Phase 2)  
→ Expand sandbox runtime with Docker-based isolation  
→ Enhance metrics with real environmental impact APIs  
→ Extend CI/CD pipeline for deployment workflows  
