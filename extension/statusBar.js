const vscode = require('vscode');

let statusBarItem;

/**
 * Creates and initializes the status bar item.
 * @param {vscode.ExtensionContext} context
 */
function createStatusBarItem(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'extension.agentSettings';
    context.subscriptions.push(statusBarItem);
    statusBarItem.show();
}

/**
 * Updates the status bar item based on extension configuration.
 */
function updateStatusBar() {
    if (!statusBarItem) return;

    const config = vscode.workspace.getConfiguration('aiCodeAssistant');
    const enableStatusBar = config.get('enableStatusBar');
    const agentType = config.get('agentType');
    const hasApiKey = config.get('apiKey') && config.get('apiKey').length > 0;

    if (enableStatusBar) {
        const status = hasApiKey ? 'Active' : 'Inactive';
        const icon = hasApiKey ? '$(robot)' : '$(warning)';
        
        statusBarItem.text = `${icon} AI Agent: ${status}`;
        statusBarItem.tooltip = `AI Code Assistant (${agentType}) - Click to configure`;
        statusBarItem.backgroundColor = hasApiKey ? undefined : new vscode.ThemeColor('statusBarItem.warningBackground');
        statusBarItem.show();
    } else {
        statusBarItem.hide();
    }
}

module.exports = {
    createStatusBarItem,
    updateStatusBar
};