# 👩‍💻 Chunk 7 – Task Split by Team

## 🔹 Tharuna (CI/CD Setup)

1. **Linting Setup**

   * Add ESLint + Prettier for extension code.
   * Add Flake8 for backend Python code.

2. **GitHub Actions Workflow**

   * Create workflow YAML in `.github/workflows/ci-cd.yml`.
   * Configure to run linting and tests on every Pull Request.
   * Configure to build `.vsix` artifact for the extension.

3. **Build Artifact**

   * Use `vsce package` to generate `.vsix` as part of workflow.
   * Ensure artifact is uploaded for manual installation/testing.

---

## 🔹 Lokesh (Leader - Support & Testing)

1. **Tests Integration**

   * Jest tests for extension commands and WebView.
   * Pytest for backend endpoints and utilities.

2. **Workflow Validation**

   * Test workflow runs on PR → lint + tests execute correctly.
   * Verify `.vsix` artifact is produced successfully.

3. **Documentation**

   * Document CI/CD workflow in `/docs/ci-cd.md`.
   * Include instructions for adding new tests, lint rules, and building extension.

---

## 📦 Deliverable from Chunk 7 Team

* Automatic linting and formatting checks for extension and backend.
* Tests executed on every PR via GitHub Actions.
* `.vsix` build artifact generated automatically.
* Workflow documented and ready for team usage.
