const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("Extension is now active!");

  // Register Hello World command
  let helloWorldDisposable = vscode.commands.registerCommand(
    "extension.helloWorld",
    function () {
      vscode.window.showInformationMessage(
        "Hello World from AI Code Optimizer!"
      );
    }
  );

  // Register WebView command
  let webViewDisposable = vscode.commands.registerCommand(
    "myextension.openWebView",
    function () {
      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        "aiCodeOptimizer", // Identifies the type of the webview
        "AI Code Optimizer", // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in
        {
          enableScripts: true, // Enable JavaScript in the webview
          retainContextWhenHidden: true, // Keep the webview alive when hidden
        }
      );

      // Set the webview's HTML content
      panel.webview.html = getWebviewContent();

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.command) {
            case "optimize":
              vscode.window.showInformationMessage(
                "Code optimization requested: " + message.text
              );
              // Here you would implement your AI optimization logic
              break;
            case "debug":
              vscode.window.showInformationMessage(
                "Debug analysis requested: " + message.text
              );
              // Here you would implement your AI debugging logic
              break;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  // IMPORTANT: Add both commands to subscriptions
  context.subscriptions.push(helloWorldDisposable, webViewDisposable);
}

function getWebviewContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Code Optimizer</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 20px;
        }
        .feature-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            background-color: var(--vscode-input-background);
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        textarea {
            width: 100%;
            height: 100px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 8px;
            font-family: monospace;
            resize: vertical;
        }
        .button-group {
            text-align: center;
            margin-top: 15px;
        }
        .status {
            margin-top: 15px;
            padding: 10px;
            border-radius: 4px;
            display: none;
        }
        .status.info {
            background-color: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI Code Optimizer & Debugger</h1>
            <p>Enhance your code with AI-powered optimization and debugging</p>
        </div>

        <div class="feature-section">
            <h3>📝 Code Input</h3>
            <textarea id="codeInput" placeholder="Paste your code here for optimization or debugging...">
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
console.log(fibonacci(10));
            </textarea>
            
            <div class="button-group">
                <button onclick="optimizeCode()">🚀 Optimize Code</button>
                <button onclick="debugCode()">🐛 Debug Analysis</button>
                <button onclick="clearCode()">🗑️ Clear</button>
            </div>
        </div>

        <div class="feature-section">
            <h3>⚡ Quick Actions</h3>
            <button onclick="showFeatures()">📋 Show Features</button>
            <button onclick="showSettings()">⚙️ Settings</button>
            <button onclick="showHelp()">❓ Help</button>
        </div>

        <div id="status" class="status"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function optimizeCode() {
            const code = document.getElementById('codeInput').value;
            if (code.trim()) {
                showStatus('Sending code for optimization...', 'info');
                vscode.postMessage({
                    command: 'optimize',
                    text: code
                });
            } else {
                showStatus('Please enter some code first!', 'error');
            }
        }

        function debugCode() {
            const code = document.getElementById('codeInput').value;
            if (code.trim()) {
                showStatus('Analyzing code for debugging...', 'info');
                vscode.postMessage({
                    command: 'debug',
                    text: code
                });
            } else {
                showStatus('Please enter some code first!', 'error');
            }
        }

        function clearCode() {
            document.getElementById('codeInput').value = '';
            hideStatus();
        }

        function showFeatures() {
            showStatus('Features: Code Optimization, Bug Detection, Performance Analysis, Security Scanning', 'info');
        }

        function showSettings() {
            showStatus('Settings panel coming soon!', 'info');
        }

        function showHelp() {
            showStatus('Help: Enter your code and click Optimize or Debug to get AI-powered suggestions!', 'info');
        }

        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status ' + type;
            status.style.display = 'block';
        }

        function hideStatus() {
            document.getElementById('status').style.display = 'none';
        }
    </script>
</body>
</html>`;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
