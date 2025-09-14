import {BerkeliumAgent} from './agent.js';
import {BerkeliumContextManager} from './context-manager.js';

export class BerkeliumRouter {
	private contextManager: BerkeliumContextManager;
	private berkeliumAgent = new BerkeliumAgent();

	constructor() {
		this.contextManager = new BerkeliumContextManager();
	}

	async routePrompt(prompt: string, threadId: string): Promise<string> {
		if (prompt.startsWith('@') && prompt.length > 1) {
			return '';
		} else {
			this.contextManager.initializeContext();
			const context = this.contextManager.context;

			// Main agent loop - continues until we get a final answer
			let result = await this.berkeliumAgent.generateResponse(
				prompt,
				context,
				threadId,
			);

			// LangChain agent handles tool execution automatically with permission checking
			// No manual tool loop needed since tools are wrapped with withPermission

			if (result.error) {
				return result.error;
			}

			return result.answer || 'No response generated.';
		}
	}
}
