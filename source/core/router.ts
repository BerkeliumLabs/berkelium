import {BerkeliumAgent} from './agent.js';
import {BerkeliumContextManager} from './context-manager.js';
import {CommandManager} from '../commands/manager.js';
import {memoryCompressionRegistry} from '../tools/compressMemory.js';

export class BerkeliumRouter {
	private contextManager: BerkeliumContextManager;
	private berkeliumAgent = new BerkeliumAgent();
	private commandManager: CommandManager;

	constructor() {
		this.contextManager = new BerkeliumContextManager();
		this.commandManager = new CommandManager();

		// Register instances with memory compression registry
		memoryCompressionRegistry.setInstances(this.berkeliumAgent, this.contextManager);
	}

	async routePrompt(prompt: string, threadId: string): Promise<string> {
		// Set the current thread ID for memory compression tool access
		memoryCompressionRegistry.setCurrentThreadId(threadId);

		if (prompt.startsWith('/') && prompt.length > 1) {
			const result = await this.commandManager.executeCommand(prompt);

			if (!result.success) {
				return result.error || 'Command execution failed';
			}

			// Execute the interpolated prompt through the agent
			this.contextManager.initializeContext();
			const context = this.contextManager.context;

			const agentResult = await this.berkeliumAgent.generateResponse(
				result.result!,
				context,
				threadId,
			);

			if (agentResult.error) {
				return agentResult.error;
			}

			return agentResult.answer || 'No response generated.';
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

	getAvailableCommands(): Array<{label: string; value: string}> {
		const commands = this.commandManager.getAllCommands();
		return commands.map(cmd => ({
			label: `/${cmd.name} - ${cmd.description}`,
			value: cmd.name,
		}));
	}

	/**
	 * Clear the agent memory for a specific thread ID
	 * @param threadId The thread ID to clear memory for
	 */
	clearAgentMemoryForThread(threadId: string): void {
		this.berkeliumAgent.clearMemoryForThread(threadId);
	}
}
