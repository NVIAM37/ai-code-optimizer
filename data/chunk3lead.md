# 👩‍💻 Chunk 3 – Task Split by Team

## 🔹 Lokesh (Leader – Extension ↔ Backend Connection)

1. **Code Capture in Extension**

   * Capture selected code/file in VS Code extension.
   * Ensure correct file path and contents are sent.

2. **Fetch Integration**

   * Send selected code to backend endpoints `/optimize` and `/debug` via fetch.
   * Handle request/response asynchronously.

3. **JSON Parsing**

   * Parse backend response JSON.
   * Display results properly in WebView tabs.

4. **WebSocket Integration**

   * Connect to backend `/stream` WebSocket.
   * Show live updates in UI: `'AI is optimizing...'`, `'Done'`.
   * Handle auto-reconnect if WebSocket disconnects.

5. **Error Handling**

   * Show fallback messages in WebView if backend or WebSocket fails.
   * Ensure extension does not crash on errors.

---

## 🔹 Team Support (All Members)

1. **Testing & Validation**

   * Run extension with backend locally.
   * Verify code sent to backend returns correct dummy JSON.
   * Confirm live WebSocket messages are displayed in WebView.

2. **Documentation**

   * Update `/docs/extension-backend.md` with fetch & WebSocket usage.
   * Include instructions for running extension + backend together.

---

## 📦 Deliverable from Chunk 3 Team

* Extension successfully sends code to backend → receives dummy responses → displays results in WebView.
* Live WebSocket messages show correctly.
* Fallback and error handling works if backend/WebSocket fails.
