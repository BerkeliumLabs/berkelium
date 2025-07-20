import { Content } from '@google/generative-ai';
import { logger } from './logger';

/**
 * Configuration for context window optimization
 */
export interface SummarizationConfig {
  maxTokensPerMessage: number;
  maxHistoryMessages: number;
  summarizationThreshold: number;
  keepRecentMessages: number;
  summaryPrompt?: string;
}

/**
 * Default configuration for context window optimization
 */
const DEFAULT_CONFIG: SummarizationConfig = {
  maxTokensPerMessage: 1000,        // Approximate tokens per message
  maxHistoryMessages: 20,           // Max messages before summarization kicks in
  summarizationThreshold: 15,       // Start summarizing when we have this many messages
  keepRecentMessages: 10,           // Keep the most recent N messages unsummarized
  summaryPrompt: `Please provide a concise summary of the following conversation history, focusing on:
1. Key technical decisions made
2. Important code changes or implementations
3. Ongoing tasks or issues
4. Relevant context for future development

Keep the summary technical and focused on what's important for continued development.

Conversation to summarize:`
};

/**
 * Manages conversation summarization to optimize context window usage
 */
export class ConversationSummarizer {
  private config: SummarizationConfig;
  private summaryCache: Map<string, string> = new Map();

  constructor(config: Partial<SummarizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.debug('SUMMARIZER', 'Conversation summarizer initialized', { config: this.config });
  }

  /**
   * Estimate the approximate token count for a message
   */
  private estimateTokenCount(content: Content): number {
    const text = this.extractTextFromContent(content);
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Extract text from content parts
   */
  private extractTextFromContent(content: Content): string {
    if (!content.parts) return '';
    
    return content.parts
      .map(part => {
        if (typeof part === 'string') return part;
        if ('text' in part) return part.text || '';
        if ('functionCall' in part) return `[Function Call: ${part.functionCall?.name}]`;
        if ('functionResponse' in part) return `[Function Response: ${part.functionResponse?.name}]`;
        return '[Non-text content]';
      })
      .join(' ');
  }

  /**
   * Calculate total estimated tokens in conversation history
   */
  private calculateTotalTokens(history: Content[]): number {
    return history.reduce((total, content) => total + this.estimateTokenCount(content), 0);
  }

  /**
   * Check if conversation history needs summarization
   */
  shouldSummarize(history: Content[]): boolean {
    const messageCount = history.length;
    const totalTokens = this.calculateTotalTokens(history);
    const estimatedMaxTokens = this.config.maxHistoryMessages * this.config.maxTokensPerMessage;

    const needsSummarization = 
      messageCount >= this.config.summarizationThreshold ||
      totalTokens > estimatedMaxTokens;

    if (needsSummarization) {
      logger.info('SUMMARIZER', 'Conversation needs summarization', {
        messageCount,
        totalTokens,
        estimatedMaxTokens,
        threshold: this.config.summarizationThreshold
      });
    }

    return needsSummarization;
  }

  /**
   * Create a conversation summary from older messages
   */
  async createSummary(
    history: Content[], 
    geminiClient: any // GeminiClient instance
  ): Promise<string> {
    try {
      // Keep recent messages, summarize the older ones
      const messagesToSummarize = history.slice(0, -this.config.keepRecentMessages);
      
      if (messagesToSummarize.length === 0) {
        return '';
      }

      // Create cache key based on messages to summarize
      const cacheKey = this.createCacheKey(messagesToSummarize);
      
      // Check if we already have a summary for this set of messages
      if (this.summaryCache.has(cacheKey)) {
        logger.debug('SUMMARIZER', 'Using cached summary');
        return this.summaryCache.get(cacheKey)!;
      }

      // Format conversation for summarization
      const conversationText = messagesToSummarize
        .map((content, index) => {
          const role = content.role === 'user' ? 'User' : 'Assistant';
          const text = this.extractTextFromContent(content);
          return `${role} (${index + 1}): ${text}`;
        })
        .join('\n\n');

      const summaryPrompt = `${this.config.summaryPrompt}\n\n${conversationText}`;

      logger.debug('SUMMARIZER', 'Generating conversation summary', {
        messagesToSummarize: messagesToSummarize.length,
        promptLength: summaryPrompt.length
      });

      // Generate summary using Gemini
      const summary = await geminiClient.generateResponse(summaryPrompt);

      // Cache the summary
      this.summaryCache.set(cacheKey, summary);

      logger.info('SUMMARIZER', 'Conversation summary generated', {
        originalMessages: messagesToSummarize.length,
        summaryLength: summary.length,
        compressionRatio: Math.round((summary.length / conversationText.length) * 100)
      });

      return summary;
    } catch (error) {
      logger.error('SUMMARIZER', 'Failed to generate conversation summary', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return '';
    }
  }

  /**
   * Optimize conversation history by summarizing older messages
   */
  async optimizeHistory(
    history: Content[], 
    geminiClient: any
  ): Promise<Content[]> {
    if (!this.shouldSummarize(history)) {
      return history;
    }

    try {
      const summary = await this.createSummary(history, geminiClient);
      
      if (!summary) {
        logger.warn('SUMMARIZER', 'Failed to generate summary, returning original history');
        return history;
      }

      // Keep recent messages
      const recentMessages = history.slice(-this.config.keepRecentMessages);
      
      // Create summarized conversation with summary as first message
      const optimizedHistory: Content[] = [
        {
          role: 'user',
          parts: [{ 
            text: `[Previous Conversation Summary]\n${summary}\n[End Summary - Current Conversation Continues Below]` 
          }]
        },
        ...recentMessages
      ];

      logger.info('SUMMARIZER', 'Conversation history optimized', {
        originalMessages: history.length,
        optimizedMessages: optimizedHistory.length,
        summaryLength: summary.length,
        recentMessagesKept: recentMessages.length
      });

      return optimizedHistory;
    } catch (error) {
      logger.error('SUMMARIZER', 'Failed to optimize conversation history', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return history;
    }
  }

  /**
   * Create a cache key for a set of messages
   */
  private createCacheKey(messages: Content[]): string {
    const key = messages
      .map(msg => this.extractTextFromContent(msg).substring(0, 50))
      .join('|');
    return Buffer.from(key).toString('base64').substring(0, 32);
  }

  /**
   * Clear the summary cache
   */
  clearCache(): void {
    this.summaryCache.clear();
    logger.debug('SUMMARIZER', 'Summary cache cleared');
  }

  /**
   * Get current configuration
   */
  getConfig(): SummarizationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SummarizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('SUMMARIZER', 'Configuration updated', { config: this.config });
  }

  /**
   * Get statistics about current cache
   */
  getCacheStats(): { entries: number; totalSize: number } {
    const entries = this.summaryCache.size;
    const totalSize = Array.from(this.summaryCache.values())
      .reduce((total, summary) => total + summary.length, 0);
    
    return { entries, totalSize };
  }
}
