const vscode = require('vscode');

/**
 * Command to run code in a sandbox.
 */
function runInSandboxCommand() {
    console.log('Run in Sandbox command executed');
    
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found. Please open a file to run in sandbox.');
        return;
    }

    const selectedText = editor.document.getText(editor.selection);
    const textToRun = selectedText || editor.document.getText();
    
    console.log('Text to run in sandbox:', textToRun.substring(0, 100) + '...');
    
    vscode.window.showInformationMessage(`Running ${selectedText ? 'selected code' : 'entire file'} in sandbox...`);
    
    // TODO: Implement actual sandbox execution
    setTimeout(() => {
        vscode.window.showInformationMessage('Sandbox execution complete! Output: "Hello World" (Mock implementation)');
    }, 1500);
}

module.exports = runInSandboxCommand;