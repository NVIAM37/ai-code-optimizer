const vscode = require('vscode');
const optimizeCodeCommand = require('./optimizeCode');
const debugCodeCommand = require('./debugCode');
const runInSandboxCommand = require('./runInSandbox');
const agentSettingsCommand = require('./agentSettings');

/**
 * Registers all extension commands.
 * @param {vscode.ExtensionContext} context
 */
function registerCommands(context) {
    const commands = [
        { command: 'extension.optimizeCode', callback: optimizeCodeCommand },
        { command: 'extension.debugCode', callback: debugCodeCommand },
        { command: 'extension.runInSandbox', callback: runInSandboxCommand },
        { command: 'extension.agentSettings', callback: () => agentSettingsCommand(context) },
    ];

    // Register each command
    commands.forEach(({ command, callback }) => {
        const disposable = vscode.commands.registerCommand(command, callback);
        context.subscriptions.push(disposable);
    });
}

module.exports = {
    registerCommands
};