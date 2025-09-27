# 👩‍💻 Chunk 2 – Task Split by Team

## 🔹 Dikhsha (Endpoints)

1. **Project Structure**

   * Create `backend/` with subfolders: `app/`, `app/routes/`, `app/models/`, `app/utils/`.
   * Add `main.py` → initialize FastAPI instance and `/health` endpoint.

2. **Endpoints Development**

   * `/optimize` → returns dummy optimized code.
   * `/debug` → returns dummy bug fix.
   * `/run` → placeholder for code execution.
   * `/metrics` → returns dummy energy/CO2 metrics.
   * `/agent/switch` → switch between dummy/real AI agents.

3. **Request/Response Validation**

   * Add Pydantic models for request/response schemas.
   * Ensure endpoints reject invalid input.

4. **Local Testing**

   * Test endpoints with Postman or curl.
   * Confirm dummy JSON returns as expected.

---

## 🔹 Nishant (WebSocket + Logging)

1. **WebSocket Setup**

   * Add `/stream` WebSocket endpoint in FastAPI.
   * Send live messages: `'tokenizing...'`, `'calling AI...'`, `'done'`.
   * Implement auto-reconnect logic for clients.

2. **Logging**

   * Log endpoint hits, execution times, WebSocket connections.
   * Log errors only (no sensitive code).
   * Format logs for readability.

3. **Integration Testing**

   * Use `websocat` or Python WebSocket client to verify live updates.

---

## 🔹 Kaivalya (Helper + Config)

1. **API Key & Agent Management**

   * Store API keys in `.env` or `config.json`.
   * Load keys securely in backend.
   * Create endpoint to read/update agent selection (dummy/real).

2. **Utility Functions**

   * Helper functions for formatting responses (JSON) and timestamps.
   * Prepare placeholders for future AI integration.

3. **Error Handling**

   * Fallback responses if endpoint fails.
   * Ensure WebSocket errors don’t crash server.

---

## 🔹 Joint Work (Dikhsha + Nishant + Kaivalya)

1. **End-to-End Testing**

   * Run backend locally → call all endpoints + WebSocket.
   * Validate dummy JSON and live messages appear correctly.

2. **Documentation**

   * Update `/docs/backend.md` with endpoints, expected JSON, and WebSocket usage.

---

## 📦 Deliverable from Chunk 2 Team

* A local FastAPI backend with:

  * Dummy endpoints working (`/optimize`, `/debug`, `/run`, `/metrics`, `/agent/switch`).
  * WebSocket streaming updates.
  * Secure API key and agent management.
  * Logs showing endpoint activity and errors only.
