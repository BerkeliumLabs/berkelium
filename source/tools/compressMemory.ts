import {BerkeliumAgent} from '../core/agent.js';
import {BerkeliumContextManager} from '../core/context-manager.js';
import useProgressStore from '../store/progress.js';

/**
 * Global registry to access the current agent and context manager instances
 */
class MemoryCompressionRegistry {
	private static instance: MemoryCompressionRegistry;
	private agent: BerkeliumAgent | null = null;
	private contextManager: BerkeliumContextManager | null = null;
	private currentThreadId: string | null = null;

	private constructor() {}

	public static getInstance(): MemoryCompressionRegistry {
		if (!MemoryCompressionRegistry.instance) {
			MemoryCompressionRegistry.instance = new MemoryCompressionRegistry();
		}
		return MemoryCompressionRegistry.instance;
	}

	public setInstances(agent: BerkeliumAgent, contextManager: BerkeliumContextManager) {
		this.agent = agent;
		this.contextManager = contextManager;
	}

	public setCurrentThreadId(threadId: string) {
		this.currentThreadId = threadId;
	}

	public getCurrentThreadId(): string | null {
		return this.currentThreadId;
	}

	public getAgent(): BerkeliumAgent | null {
		return this.agent;
	}

	public getContextManager(): BerkeliumContextManager | null {
		return this.contextManager;
	}
}

export const memoryCompressionRegistry = MemoryCompressionRegistry.getInstance();

export interface CompressMemoryArgs {
	thread_id?: string;
}

export async function compressMemory({thread_id}: CompressMemoryArgs): Promise<{
	success: boolean;
	output: string;
	error?: string;
}> {
	try {
		useProgressStore.getState().setProgress('Compressing memory...');
		const agent = memoryCompressionRegistry.getAgent();
		const contextManager = memoryCompressionRegistry.getContextManager();

		if (!agent) {
			return {
				success: false,
				output: '',
				error: 'Agent instance not available for memory compression',
			};
		}

		if (!contextManager) {
			return {
				success: false,
				output: '',
				error: 'Context manager not available for memory compression',
			};
		}

		// Use the provided thread_id, or fall back to the current thread ID if not provided
		const targetThreadId = thread_id || memoryCompressionRegistry.getCurrentThreadId();

		if (!targetThreadId) {
			return {
				success: false,
				output: '',
				error: 'No thread ID available for memory compression',
			};
		}

		useProgressStore
			.getState()
			.setProgress('Retrieving conversation history...');
		// Get current conversation history with timeout protection
		const historyTimeoutPromise = new Promise<any[]>((_, reject) => {
			setTimeout(() => reject(new Error('Conversation history retrieval timed out after 10 seconds')), 10000);
		});
		
		let messages;
		try {
			messages = await Promise.race([
				agent.getConversationHistory(targetThreadId),
				historyTimeoutPromise
			]);
		} catch (historyError: any) {
			return {
				success: false,
				output: '',
				error: `Failed to retrieve conversation history: ${historyError.message}. Please try again later.`,
			};
		}

		if (messages.length === 0) {
			return {
				success: false,
				output: '',
				error: 'No conversation history found to compress',
			};
		}

		useProgressStore
			.getState()
			.setProgress('Formatting conversation for summarization...');
		// Format messages into readable text for summarization
		const conversationText = messages
			.map((msg: any) => {
				const type = msg._getType ? msg._getType() : msg.type || 'unknown';
				const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);

				if (type === 'system') return `[SYSTEM]: ${content}`;
				if (type === 'human') return `[USER]: ${content}`;
				if (type === 'ai') return `[ASSISTANT]: ${content}`;
				if (type === 'tool') return `[TOOL RESULT]: ${content}`;
				return `[${type.toUpperCase()}]: ${content}`;
			})
			.join('\n\n');

		// Create summarization prompt
		const summarizationPrompt = `Please analyze this conversation history and create a comprehensive yet concise summary that captures:

1. **Key Tasks Completed**: What has been accomplished in this session
2. **Current Project State**: Important context about the codebase/project
3. **Ongoing Work**: Any incomplete tasks or work in progress
4. **Important Decisions**: Key technical decisions or approaches discussed
5. **Relevant Context**: Critical information needed for future interactions

The summary should be detailed enough to maintain effective context for future conversations while being significantly more token-efficient than the full conversation history.

CONVERSATION HISTORY:
${conversationText}

Please provide a structured summary that will serve as compressed memory for future interactions:`;

		// Get current system context
		contextManager.initializeContext();
		const systemContext = contextManager.context;

		useProgressStore.getState().setProgress('Generating conversation summary...');
		// Generate summary using a temporary thread to avoid affecting current conversation
		const summaryThreadId = `${targetThreadId}_summary_${Date.now()}`;
		
		// Implement timeout mechanism to prevent hanging
		const timeoutPromise = new Promise<{ finished: boolean; answer?: string; error?: string }>((_, reject) => {
			setTimeout(() => reject(new Error('Response generation timed out after 30 seconds')), 30000);
		});
		
		let summaryResult;
		try {
			summaryResult = await Promise.race([
				agent.generateResponse(summarizationPrompt, systemContext, summaryThreadId),
				timeoutPromise
			]);
		} catch (timeoutError: any) {
			// Clean up temporary thread on timeout
			agent.clearMemoryForThread(summaryThreadId);
			
			return {
				success: false,
				output: '',
				error: `Response generation timed out: ${timeoutError.message}. This can happen due to network issues or heavy API load. Please try again later.`,
			};
		}

		if (summaryResult.error || !summaryResult.answer) {
			return {
				success: false,
				output: '',
				error: summaryResult.error || 'Failed to generate conversation summary',
			};
		}

		const summary = summaryResult.answer;

		useProgressStore.getState().setProgress('Compressing memory with summary...');
		// Compress the memory with the summary
		const compressTimeoutPromise = new Promise<void>((_, reject) => {
			setTimeout(() => reject(new Error('Memory compression timed out after 30 seconds')), 30000);
		});
		
		try {
			await Promise.race([
				agent.compressMemoryForThread(targetThreadId, summary, systemContext),
				compressTimeoutPromise
			]);
		} catch (compressError: any) {
			return {
				success: false,
				output: '',
				error: `Memory compression timed out: ${compressError.message}. Please try again later.`,
			};
		}

		// Clean up temporary thread
		agent.clearMemoryForThread(summaryThreadId);

		return {
			success: true,
			output: `✅ Memory compressed successfully!

**Conversation Summary:**
${summary}

The conversation history has been replaced with this summary to save tokens while preserving important context for future interactions.`,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		useProgressStore.getState().setProgress(errorMessage);
		return {
			success: false,
			output: '',
			error: `Failed to compress memory: ${errorMessage}`,
		};
	}
}