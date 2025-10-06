const vscode = require('vscode');
const { createStatusBarItem, updateStatusBar } = require('./statusBar');
const { registerCommands } = require('./commands/registerCommands');
const { openWebViewCommand } = require('./webviews/aiCodeAssistant');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('AI Code Assistant is now active!');

    // Create and manage the status bar item
    createStatusBarItem(context);
    
    // Register all commands
    registerCommands(context);

    // Register webview command
    const webViewDisposable = vscode.commands.registerCommand('extension.openWebView', () => openWebViewCommand(context));
    context.subscriptions.push(webViewDisposable);

    // Listen for configuration changes to update status bar
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('aiCodeAssistant')) {
            updateStatusBar();
        }
    });

    // Update status bar initially
    updateStatusBar();
}

function deactivate() {
    // VS Code handles disposal of registered items
}

module.exports = {
    activate,
    deactivate
};