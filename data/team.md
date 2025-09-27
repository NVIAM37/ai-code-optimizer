# 🔹 Chunk-to-Folder Mapping (Simplified)

- **Chunk 1 – VS Code Extension (Frontend)** → `extension/`
- **Chunk 2 – Backend Service (FastAPI)** → `backend/routes/`
- **Chunk 3 – Extension ↔ Backend Connection** → Code inside `extension/src/` + fetch calls to `backend/`
- **Chunk 4 – AI Integration (Dummy + Adapter)** → `backend/adapters/`
- **Chunk 5 – Sandbox Runtime** → `backend/sandbox/`
- **Chunk 6 – Energy Metrics (Dummy)** → `backend/metrics/`
- **Chunk 7 – CI/CD** → `.github/workflows/` + `tests/` + `docs/ci-cd.md`
- **Chunk 8 – Internal Testing & Deploy** → Logs in `CHANGELOG.md`, test across whole repo
