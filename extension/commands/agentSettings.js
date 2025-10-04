const vscode = require('vscode');

/**
 * Command to open a quick pick menu for agent settings.
 * @param {vscode.ExtensionContext} context
 */
async function agentSettingsCommand(context) {
    console.log('Agent Settings command executed');
    
    const config = vscode.workspace.getConfiguration('aiCodeAssistant');
    const currentAgentType = config.get('agentType');
    const hasApiKey = config.get('apiKey') && config.get('apiKey').length > 0;

    const options = [
        'Configure API Key',
        'Change Agent Type',
        'Toggle Status Bar',
        'Open Settings'
    ];

    const selection = await vscode.window.showQuickPick(options, {
        placeHolder: `Current Agent: ${currentAgentType} | API Key: ${hasApiKey ? 'Set' : 'Not Set'}`
    });

    switch (selection) {
        case 'Configure API Key':
            const apiKey = await vscode.window.showInputBox({
                prompt: 'Enter your AI service API key',
                password: true,
                value: config.get('apiKey')
            });
            if (apiKey !== undefined) {
                await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('API key updated successfully!');
            }
            break;
            
        case 'Change Agent Type':
            const agentTypes = ['optimizer', 'debugger', 'analyzer', 'full-stack'];
            const newAgentType = await vscode.window.showQuickPick(agentTypes, {
                placeHolder: `Current: ${currentAgentType}`
            });
            if (newAgentType) {
                await config.update('agentType', newAgentType, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Agent type changed to: ${newAgentType}`);
            }
            break;
            
        case 'Toggle Status Bar':
            const currentStatus = config.get('enableStatusBar');
            await config.update('enableStatusBar', !currentStatus, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Status bar ${!currentStatus ? 'enabled' : 'disabled'}`);
            break;
            
        case 'Open Settings':
            vscode.commands.executeCommand('workbench.action.openSettings', 'aiCodeAssistant');
            break;
    }
}

module.exports = agentSettingsCommand;