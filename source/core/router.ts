


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
			return this.berkeliumAgent.generateResponse(prompt, context, threadId);
		}
	}
}
