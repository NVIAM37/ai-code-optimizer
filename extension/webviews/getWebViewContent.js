const vscode = require('vscode');

/**
 * Generates the HTML content for the AI Code Assistant webview.
 * @returns {string} The complete HTML string.
 */
function getWebviewContent() {
    const config = vscode.workspace.getConfiguration('aiCodeAssistant');
    const agentType = config.get('agentType');
    const hasApiKey = config.get('apiKey') && config.get('apiKey').length > 0;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Code Assistant</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 20px;
        }
        .status-card {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .status-active {
            border-color: var(--vscode-inputValidation-infoBackground);
        }
        .status-inactive {
            border-color: var(--vscode-inputValidation-warningBackground);
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .feature-card {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .code-section {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
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
            transition: background-color 0.2s;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        textarea {
            width: 100%;
            height: 150px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 10px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            resize: vertical;
            margin-bottom: 15px;
        }
        .emoji {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }
        .status-active .status-indicator {
            background-color: #4CAF50;
        }
        .status-inactive .status-indicator {
            background-color: #FF9800;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI Code Assistant</h1>
            <p>Intelligent code optimization, debugging, and analysis</p>
        </div>

        <div class="status-card ${hasApiKey ? 'status-active' : 'status-inactive'}">
            <div>
                <span class="status-indicator"></span>
                <strong>Agent Status:</strong> ${hasApiKey ? 'Active' : 'Inactive'}
                <span style="margin-left: 20px;">
                    <strong>Type:</strong> ${agentType}
                </span>
            </div>
            <button onclick="openSettings()" class="secondary">⚙️ Settings</button>
        </div>

        <div class="feature-grid">
            <div class="feature-card">
                <div class="emoji">🚀</div>
                <h3>Code Optimizer</h3>
                <p>Improve performance and readability</p>
                <button onclick="quickOptimize()">Quick Optimize</button>
            </div>
            
            <div class="feature-card">
                <div class="emoji">🐛</div>
                <h3>Bug Detector</h3>
                <p>Find and fix potential issues</p>
                <button onclick="quickDebug()">Quick Debug</button>
            </div>
            
            <div class="feature-card">
                <div class="emoji">🏃</div>
                <h3>Sandbox Runner</h3>
                <p>Test code safely</p>
                <button onclick="quickSandbox()">Quick Run</button>
            </div>
        </div>

        <div class="code-section">
            <h3>📝 Code Analysis</h3>
            <textarea id="codeInput" placeholder="Paste your code here for analysis...">
function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        total += items[i].price;
    }
    return total;
}

// Example usage
const items = [
    { name: "Item 1", price: 10 },
    { name: "Item 2", price: 25 }
];
console.log(calculateTotal(items));
            </textarea>
            
            <div style="text-align: center;">
                <button onclick="analyzeCode('optimize')">🚀 Optimize This Code</button>
                <button onclick="analyzeCode('debug')">🐛 Debug Analysis</button>
                <button onclick="analyzeCode('sandbox')">🏃 Run in Sandbox</button>
                <button onclick="clearCode()" class="secondary">🗑️ Clear</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function quickOptimize() {
            vscode.postMessage({ command: 'optimize', text: 'Quick optimize from current editor' });
        }

        function quickDebug() {
            vscode.postMessage({ command: 'debug', text: 'Quick debug from current editor' });
        }

        function quickSandbox() {
            vscode.postMessage({ command: 'sandbox', text: 'Quick sandbox from current editor' });
        }

        function analyzeCode(type) {
            const code = document.getElementById('codeInput').value;
            if (code.trim()) {
                vscode.postMessage({ command: type, text: code });
            } else {
                alert('Please enter some code to analyze!');
            }
        }

        function clearCode() {
            document.getElementById('codeInput').value = '';
        }

        function openSettings() {
            vscode.postMessage({ command: 'settings' });
        }
    </script>
</body>
</html>`;
}

module.exports = getWebviewContent;