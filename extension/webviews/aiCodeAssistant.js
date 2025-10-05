const vscode = require('vscode');
const getWebviewContent = require('./getWebviewContent');

/**
 * Command to open the AI Code Assistant WebView panel.
 * @param {vscode.ExtensionContext} context
 */
function openWebViewCommand(context) {
    console.log('Open WebView command executed');
    
    const panel = vscode.window.createWebviewPanel(
        'aiCodeAssistant',
        'AI Code Assistant',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'optimize':
                console.log('WebView optimize request:', message.text);
                vscode.window.showInformationMessage('Code optimization requested from WebView');
                break;
            case 'debug':
                console.log('WebView debug request:', message.text);
                vscode.window.showInformationMessage('Debug analysis requested from WebView');
                break;
            case 'sandbox':
                console.log('WebView sandbox request:', message.text);
                vscode.window.showInformationMessage('Sandbox execution requested from WebView');
                break;
            case 'settings':
                console.log('WebView settings request');
                vscode.commands.executeCommand('extension.agentSettings');
                break;
        }
    });

    context.subscriptions.push(panel);
}

module.exports = {
    openWebViewCommand
};