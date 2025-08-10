


import {usePersonaStore} from '../store/context.js';
import {BerkeliumAgent} from './agent.js';
import {BerkeliumContextManager} from './context-manager.js';
import { BERKELIUM_PERSONAS } from '../personas/index.js';

export class BerkeliumRouter {
	private contextManager: BerkeliumContextManager;
	private berkeliumAgent = new BerkeliumAgent();

	constructor() {
		this.contextManager = new BerkeliumContextManager();
	}

	async routePrompt(prompt: string, threadId: string): Promise<string> {
		if (prompt.startsWith('@') && prompt.length > 1) {
			const firstWord = prompt.split(' ')[0];
			const foundPersona = firstWord ? firstWord.substring(1) : '';
			const matchedPersona = BERKELIUM_PERSONAS.find(
				p => p.value === foundPersona,
			);
			if (!matchedPersona) {
				console.error(`🔴 Unknown persona: ${foundPersona}`);
				return `Unknown persona: ${foundPersona}`;
			}
			usePersonaStore.getState().setPersona(foundPersona);
			this.contextManager.initializeContext();
			return matchedPersona.greet;
		} else {
			this.contextManager.initializeContext();
			const context = this.contextManager.context;
			return this.berkeliumAgent.generateResponse(prompt, context, threadId);
		}
	}
}
