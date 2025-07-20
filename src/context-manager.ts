import { Content, Part } from '@google/generative-ai';

/**
 * Represents a single message in the conversation
 */
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  parts?: Part[];
}

/**
 * Manages conversation history and context
 */
export class ContextManager {
  private chatHistory: Content[] = [];

  /**
   * Add a user message to the history
   */
  addUserMessage(content: string): void {
    this.chatHistory.push({
      role: 'user',
      parts: [{ text: content }]
    });
  }

  /**
   * Add a model message to the history
   */
  addModelMessage(parts: Part[]): void {
    this.chatHistory.push({
      role: 'model',
      parts
    });
  }

  /**
   * Add a function response to the history
   */
  addFunctionResponse(functionName: string, response: any): void {
    this.chatHistory.push({
      role: 'function',
      parts: [{
        functionResponse: {
          name: functionName,
          response
        }
      }]
    });
  }

  /**
   * Get the chat history in Gemini API format
   */
  getChatHistory(): Content[] {
    return [...this.chatHistory];
  }

  /**
   * Get a formatted conversation context for display
   */
  getConversationContext(): string {
    return this.chatHistory
      .filter(msg => msg.role === 'user' || msg.role === 'model')
      .map(msg => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        const text = msg.parts?.[0] && 'text' in msg.parts[0] ? msg.parts[0].text : '[non-text content]';
        return `${role}: ${text}`;
      })
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
