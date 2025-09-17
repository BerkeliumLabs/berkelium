import {ChatGoogleGenerativeAI} from '@langchain/google-genai';
import {createReactAgent} from '@langchain/langgraph/prebuilt';
import {ConfigManager} from '../utils/config.js';
import {tools} from '../tools/index.js';
import {SystemMessage, HumanMessage, AIMessage} from '@langchain/core/messages';
import {ToolMessage} from '@langchain/core/messages';
import {ToolCall} from '@langchain/core/messages/tool';
import {MemorySaver} from '@langchain/langgraph';
import {useUsageMetaDataStore} from '../store/usage.js';

export class BerkeliumAgent {
	private configManager: ConfigManager;

	public berkeliumAgent!: ReturnType<typeof createReactAgent>;
	private memory: MemorySaver;

	constructor() {
		this.configManager = ConfigManager.getInstance();
		this.memory = new MemorySaver();
		this.initializeContext();
	}

	private initializeContext(): void {
		try {
			const apiKey = this.configManager.getApiKey();
			if (!apiKey) {
				console.error('🔴 API key is not set in the configuration.\n');
				return;
			}

			// Initialize the context manager with the API key
			const llm = new ChatGoogleGenerativeAI({
				model: process.env['GEMINI_MODEL'] || 'gemini-2.0-flash-lite',
				maxOutputTokens: 2048,
				apiKey: apiKey,
			});

			this.berkeliumAgent = createReactAgent({
				llm,
				tools,
				checkpointer: this.memory,
			});

			// console.log("✅ Context Manager initialized successfully");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			console.error('🔴 Failed to initialize Context Manager:', errorMessage);
			process.exit(1);
		}
	}

	async generateResponse(
		prompt: string,
		context: string,
		threadId: string,
	): Promise<{
		finished: boolean;
		answer?: string;
		toolCalls?: ToolCall[];
		error?: string;
	}> {
		const config = {
			configurable: {
				thread_id: threadId,
			},
		};
		const checkpoint = await this.memory.get(config);
		const currentMessages = checkpoint?.channel_values['messages'] ?? [];
		let messages: (SystemMessage | HumanMessage | ToolMessage)[] = [];
		if (Array.isArray(currentMessages) && currentMessages.length === 0) {
			messages.push(new SystemMessage(context));
		}
		messages.push(new HumanMessage(prompt));

		try {
			const result = await this.berkeliumAgent.invoke(
				{messages},
				{
					configurable: {
						thread_id: threadId,
					},
				},
			);

			if (result['tool_calls'] && result['tool_calls'].length > 0) {
				// Return tool calls for external processing
				return {
					finished: false,
					toolCalls: result['tool_calls'],
				};
			} else {
				// Process final answer
				const aiResponse: AIMessage = result['messages'].at(-1) as AIMessage;
				const aiContent = aiResponse?.content;
				let finalAnswer = '';

				if (typeof aiContent === 'string') {
					finalAnswer = aiContent;
				} else if (Array.isArray(aiContent)) {
					finalAnswer = aiContent
						.map(item => {
							if (typeof item === 'string') {
								return item;
							} else if ('text' in item && typeof item.text === 'string') {
								return item.text;
							} else if (
								'image_url' in item &&
								typeof item.image_url === 'string'
							) {
								return '[Image]';
							}
							return '';
						})
						.join(' ');
				}

				const usageMetaData = aiResponse?.usage_metadata ?? {
					input_tokens: 0,
					output_tokens: 0,
					total_tokens: 0,
				};
				useUsageMetaDataStore.getState().setUsageMetaData(usageMetaData);

				return {
					finished: true,
					answer: finalAnswer,
				};
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			return {
				finished: true,
				error: `🔴 Berkelium Agent API error: ${errorMessage}`,
			};
		}
	}

	async processToolResults(
		toolResults: {tool_call_id: string; result: any}[],
		threadId: string,
	): Promise<{
		finished: boolean;
		answer?: string;
		toolCalls?: ToolCall[];
		error?: string;
	}> {
		try {
			const toolMessages = toolResults.map(
				({result, tool_call_id}) => new ToolMessage(result, tool_call_id),
			);

			const result = await this.berkeliumAgent.invoke(
				{messages: toolMessages},
				{
					configurable: {
						thread_id: threadId,
					},
				},
			);

			if (result['tool_calls'] && result['tool_calls'].length > 0) {
				return {
					finished: false,
					toolCalls: result['tool_calls'],
				};
			} else {
				const aiResponse: AIMessage = result['messages'].at(-1) as AIMessage;
				const aiContent = aiResponse?.content;
				let finalAnswer = '';

				if (typeof aiContent === 'string') {
					finalAnswer = aiContent;
				} else if (Array.isArray(aiContent)) {
					finalAnswer = aiContent
						.map(item => {
							if (typeof item === 'string') {
								return item;
							} else if ('text' in item && typeof item.text === 'string') {
								return item.text;
							} else if (
								'image_url' in item &&
								typeof item.image_url === 'string'
							) {
								return '[Image]';
							}
							return '';
						})
						.join(' ');
				}

				const usageMetaData = aiResponse?.usage_metadata ?? {
					input_tokens: 0,
					output_tokens: 0,
					total_tokens: 0,
				};
				useUsageMetaDataStore.getState().setUsageMetaData(usageMetaData);

				return {
					finished: true,
					answer: finalAnswer,
				};
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			return {
				finished: true,
				error: `🔴 Berkelium Agent API error: ${errorMessage}`,
			};
		}
	}

	/**
	 * Clear the memory for a specific thread ID
	 * @param threadId The thread ID to clear memory for
	 */
	clearMemoryForThread(threadId: string): void {
		try {
			// Clear the checkpoint for this thread_id from the memory store
			if (this.memory && (this.memory as any).storage) {
				const storage = (this.memory as any).storage;
				// Delete all checkpoint entries for the given thread_id
				for (const key in storage) {
					if (key.startsWith(`thread_id:${threadId}`) || key.includes(threadId)) {
						delete storage[key];
					}
				}
			}
		} catch (error) {
			console.warn('Warning: Failed to clear agent memory for thread:', threadId, error);
		}
	}

	/**
	 * Get current conversation messages for a thread
	 * @param threadId The thread ID to get messages for
	 * @returns Array of messages or empty array if no messages found
	 */
	async getConversationHistory(threadId: string): Promise<any[]> {
		try {
			const config = {
				configurable: {
					thread_id: threadId,
				},
			};
			const checkpoint = await this.memory.get(config);
			return checkpoint?.channel_values['messages'] as any[] ?? [];
		} catch (error) {
			console.warn('Warning: Failed to get conversation history for thread:', threadId, error);
			return [];
		}
	}

	/**
	 * Compress conversation memory by replacing it with a summary
	 * @param threadId The thread ID to compress memory for
	 * @param summary The summary to replace the conversation with
	 * @param systemContext The system context to preserve
	 */
	async compressMemoryForThread(threadId: string, summary: string, systemContext: string): Promise<void> {
		try {
			// Clear existing memory
			this.clearMemoryForThread(threadId);

			// Create new compressed memory with system message and summary
			const compressedMessages = [
				new SystemMessage(systemContext),
				new HumanMessage(`[CONVERSATION SUMMARY FROM PREVIOUS SESSION]\n\n${summary}`)
			];

			// Initialize the memory with compressed content
			const config = {
				configurable: {
					thread_id: threadId,
				},
			};

			// Invoke with the compressed messages to establish new baseline
			await this.berkeliumAgent.invoke(
				{ messages: compressedMessages },
				config
			);
		} catch (error) {
			console.warn('Warning: Failed to compress memory for thread:', threadId, error);
		}
	}
}
