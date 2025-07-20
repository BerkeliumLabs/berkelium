/**
 * Represents a single message in the conversation
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Manages conversation history and context
 */
export class ContextManager {
  private chatHistory: ChatMessage[] = [];

  /**
   * Add a user message to the history
   */
  addUserMessage(content: string): void {
    this.chatHistory.push({
      role: 'user',
      content,
      timestamp: new Date()
    });
  }

  /**
   * Add an assistant message to the history
   */
  addAssistantMessage(content: string): void {
    this.chatHistory.push({
      role: 'assistant',
      content,
      timestamp: new Date()
    });
  }

  /**
   * Get the full chat history
   */
  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  /**
   * Get a formatted conversation context for the AI
   */
  getConversationContext(): string {
    if (this.chatHistory.length === 0) {
      return '';
    }

    return this.chatHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
  }

  /**
   * Clear the conversation history
   */
  clearHistory(): void {
    this.chatHistory = [];
  }

  /**
   * Get the number of messages in history
   */
  getHistoryLength(): number {
    return this.chatHistory.length;
  }
}
