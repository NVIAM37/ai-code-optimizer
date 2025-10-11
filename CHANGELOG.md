
Updates by Nishanth – Chunk 2 (Backend Service & Logging)
Date: 06 Oct 2025

Added custom logging:
Logs all endpoint calls and WebSocket connections.
Logs both to console and backend.log file.
Logs timestamped entries for request tracking and error handling.
Successfully tested all endpoints via Swagger UI and Postman.
Verified WebSocket connection using Python websockets client.
=======
# changes by NVIAM 
## Updates by Diksha – Chunk 2 (Backend Service)

### Date: 03 Oct 2025
- Implemented FastAPI backend structure under `/backend`.
- Added endpoints:
  - `/optimize` – returns dummy optimized code.
  - `/debug` – returns dummy debugged code.
  - `/run` – returns dummy code execution response.
  - `/metrics` – returns dummy energy usage data.
  - `/agent/switch` – switches between AI agents.
  - `/stream` – WebSocket for live updates.
- Integrated `.env` support using `python-dotenv` for agent configurations.
- Successfully tested all endpoints via Swagger and Postman.
- Verified WebSocket connection using Python `websockets` client.


# Update Instructions – Chunk 7 & 

All updates from NVIAM for **Chunk 7** or the **README** should be properly added to their respective markdown files.

## Guidelines

1. **Chunk 7 Updates**
   - File: `data/chunk7lead.md`
   - Include all progress, task completions, and relevant notes.
   - Use clear headings and bullet points for readability.

2. **README Updates**
   - File: `README.md`
   - Reflect changes in project scope, chunk deliverables, or team responsibilities.
   - Ensure the structure remains clean and professional.
   - Avoid adding emojis; use arrows or clean formatting. 

## Updates by Tharuna – Chunk 7 (CI/CD)

### Date: 04 Oct 2025
- Created dummy GitHub Actions workflow for automatic linting and VSIX build.
- Frontend: ESLint + Prettier checks.
- Backend: Flake8 linting.
- `.vsix` artifact generated automatically for testing.
- This is a dummy setup; real integration will be added later.

