# 👩‍💻 Chunk 1 – Task Split by Team

## 🔹 Charan (Setup + Foundation)

1. **Project Scaffold**
   - Install `yo` + `generator-code`.
   - Run `yo code` → scaffold with JavaScript + WebView.
   - Push initial extension skeleton to repo.

2. **Commands Setup**
   - Add `Optimize Code`, `Debug Code`, `Run in Sandbox`, `Agent Settings` in `package.json`.
   - Wire commands in `extension.js` with dummy logs.

3. **Status Bar Item**
   - Add status bar → `AI Agent: Active` with tooltip.

4. **Settings Panel Config**
   - In `package.json`, add extension settings (API key + agent type).
   - Test in VS Code preferences.

5. **Lint + Prettier**
   - Add ESLint + Prettier configs.
   - Make sure repo formatting is consistent.

---

## 🔹 Vanshika (UI – WebView Design)

1. **WebView Structure**
   - Create HTML/CSS layout with tabs: Optimize, Debug, Metrics.
   - Add placeholder content in each tab.

2. **UI Polish**
   - Ensure tabs look clean (basic styling).
   - Dummy icons/text for a professional look.

3. **Integration with Extension**
   - Connect WebView to commands so panel opens when extension runs.
   - Test switching between tabs.

---

## 🔹 Joint Work (Charan + Vanshika)

1. **Testing**
   - Run extension in VS Code with `F5`.
   - Verify commands open UI + status bar shows correctly.
   - Check settings panel works.

2. **Packaging**
   - Use `vsce package` to generate `.vsix`.
   - Install manually in VS Code → confirm everything works.

---

## 📦 Deliverable from Chunk 1 Team

- A `.vsix` file with:
  - Commands wired.
  - Dummy WebView UI (tabs ready).
  - Status bar active.
  - Settings configurable.


