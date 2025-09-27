# 👩‍💻 Chunk 5 – Task Split by Team

## 🔹 Lokesh + Sneha (Sandbox Runtime)

1. **Safe Code Execution**

   * Implement `/run` endpoint in backend to execute user code.
   * Use `subprocess.run()` in Python with sandboxing considerations.

2. **Timeout Handling**

   * Add execution timeout (e.g., 5 seconds) to prevent infinite loops.
   * Return error JSON if timeout occurs.

3. **Output Capture**

   * Capture `stdout` and `stderr`.
   * Return results as JSON: `{output: '...', error: null, runtime_ms: 123}`.

4. **Environment Restrictions**

   * Restrict code execution to safe operations only.
   * Prepare for Docker integration in Phase 2 for full isolation.

5. **Testing**

   * Run sample code snippets through `/run`.
   * Verify output, error handling, and timeout behavior.

6. **Documentation**

   * Update `/docs/sandbox.md` with instructions for `/run` endpoint usage and safety guidelines.

---

## 📦 Deliverable from Chunk 5 Team

* Backend `/run` endpoint executes code safely.
* Timeout and error handling functional.
* JSON output structured for extension consumption.
* Sandbox ready for Docker integration in future phases.
