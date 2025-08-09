import {BerkeliumAgent} from './agent.js';
import {BerkeliumContextManager} from './context-manager.js';

export class BerkeliumRouter {
	private contextManager: BerkeliumContextManager;
	private berkeliumAgent = new BerkeliumAgent();

	constructor() {
		this.contextManager = new BerkeliumContextManager();
	}

	async routePrompt(prompt: string): Promise<string> {
		this.contextManager.initializeContext();
		return this.berkeliumAgent.generateResponse(
			prompt,
			this.contextManager.context,
		);
	}
}
