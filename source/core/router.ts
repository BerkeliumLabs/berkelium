import {BerkeliumAgent} from './agent.js';
import {BerkeliumContextManager} from './context-manager.js';
import {executeTool} from '../tools/executor.js';

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

			while (!result.finished) {
				if (result.toolCalls && result.toolCalls.length > 0) {
					// Execute tools with user permission
					const toolResults = [];
					for (const toolCall of result.toolCalls) {
						try {
							const executionResult = await executeTool(toolCall);
							toolResults.push({
								tool_call_id: toolCall.id ?? '',
								result: JSON.stringify(executionResult),
							});
						} catch (error) {
							const errorMessage =
								error instanceof Error ? error.message : 'Unknown error';
							toolResults.push({
								tool_call_id: toolCall.id ?? '',
								result: JSON.stringify({
									success: false,
									error: errorMessage,
								}),
							});
						}
					}

					// Process tool results and continue the conversation
					result = await this.berkeliumAgent.processToolResults(
						toolResults,
						threadId,
					);
				} else {
					break;
				}
			}

			if (result.error) {
				return result.error;
			}

			return result.answer || 'No response generated.';
		}
	}
}
