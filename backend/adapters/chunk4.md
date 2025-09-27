# 👩‍💻 Chunk 4 – Task Split by Team

## 🔹 Fiza (AI Integration – Dummy + Adapter)

1. **Dummy AI Adapter**

   * Create `dummy_adapter.py` with functions: `optimizeDummy()`, `debugDummy()`.
   * Ensure these functions return placeholder optimized/debugged code.

2. **Real AI Adapter (Preparation)**

   * Create `openai_adapter.py` → connect to OpenAI API (dummy credentials for now).
   * Prepare code structure to switch from dummy to real AI in Phase 2.

3. **Adapter Manager**

   * Implement a manager to select between dummy or real AI adapters based on settings.
   * Ensure seamless switching in backend.

4. **Prompt Templates**

   * Create reusable prompt templates for Optimize, Debug, and Humanize tasks.
   * Keep placeholders for future AI integration.

5. **Error Handling**

   * Fallback messages if AI fails or returns invalid response.
   * Ensure backend and extension do not crash due to AI errors.

---

## 🔹 Joint Work (Team Support)

1. **Testing**

   * Test dummy AI functions with backend endpoints.
   * Ensure correct JSON response format for extension consumption.

2. **Documentation**

   * Update `/docs/ai-integration.md` with adapter usage, dummy API, and switching instructions.

---

## 📦 Deliverable from Chunk 4 Team

* Dummy AI adapter fully functional.
* Real AI adapter structure ready for Phase 2.
* Adapter manager switches seamlessly.
* Error handling in place to prevent crashes.
