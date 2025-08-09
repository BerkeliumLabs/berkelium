import { BerkeliumAgent } from "./agent.js";

export class BerkeliumRouter {
    private berkeliumAgent = new BerkeliumAgent();

	constructor() {
		// Initialize router
	}

    routePrompt(prompt: string): Promise<string> {
        return this.berkeliumAgent.generateResponse(prompt);
    }
}
