import { Content, Part } from '@google/generative-ai';
import { ContextDiscovery } from './utils/context-discovery';
import { UserContextParser } from './utils/user-context';
import { ProjectInstructions } from './utils/project-instructions';
import { ConversationSummarizer } from './utils/conversation-summarizer';
import { logger } from './utils/logger';

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
  private autoContextEnabled: boolean = true;
  private conversationSummarizer: ConversationSummarizer;

  constructor() {
    this.conversationSummarizer = new ConversationSummarizer();
  }

  /**
   * Enable or disable automatic context discovery
   */
  setAutoContext(enabled: boolean): void {
    this.autoContextEnabled = enabled;
  }

  /**
   * Add a user message to the history with optional auto-context
   */
  async addUserMessage(content: string): Promise<void> {
    logger.debug('CONTEXT', 'Adding user message', { 
      contentLength: content.length,
      autoContextEnabled: this.autoContextEnabled 
    });
    
    let enhancedContent = content;

    // First, add project-specific instructions if available
    try {
      const projectInstructions = await ProjectInstructions.loadProjectInstructions();
      if (projectInstructions) {
        const formattedInstructions = ProjectInstructions.formatInstructionsForContext(projectInstructions);
        enhancedContent = `${enhancedContent}${formattedInstructions}`;
        console.log('📋 Added project-specific instructions');
        logger.info('CONTEXT', 'Project instructions added', { 
          instructionsLength: projectInstructions.length 
        });
      }
    } catch (error) {
      logger.warn('CONTEXT', 'Failed to load project instructions', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Second, process user-defined context (@file_name syntax)
    if (UserContextParser.hasFileReferences(content)) {
      logger.debug('CONTEXT', 'Processing file references in user input');
      enhancedContent = await UserContextParser.processUserInput(enhancedContent);
      console.log('📎 Processed file references in your message');
      logger.info('CONTEXT', 'File references processed', { 
        originalLength: content.length, 
        enhancedLength: enhancedContent.length 
      });
    }

    // Third, add automatic context if enabled (and no user-defined context was used)
    if (this.autoContextEnabled && !UserContextParser.hasFileReferences(content)) {
      try {
        logger.debug('CONTEXT', 'Discovering relevant files for auto-context');
        const relevantFiles = await ContextDiscovery.discoverRelevantFiles();
        if (relevantFiles.length > 0) {
          const fileContext = await ContextDiscovery.prepareFileContext(relevantFiles.slice(0, 5)); // Limit to 5 files
          if (fileContext) {
            enhancedContent = `${enhancedContent}${fileContext}`;
            // Only show context message if debug is enabled or if it's significant
            if (relevantFiles.length >= 3) {
              console.log(`📁 Added context from ${relevantFiles.length} relevant files`);
            }
            logger.info('CONTEXT', 'Auto-context added', { 
              fileCount: relevantFiles.length,
              finalContentLength: enhancedContent.length 
            });
          }
        }
      } catch (error) {
        // If context discovery fails, continue with original content
        logger.warn('CONTEXT', 'Failed to add auto-context', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        // Don't show debug messages to user unless debug is enabled
      }
    }

    this.chatHistory.push({
      role: 'user',
      parts: [{ text: enhancedContent }]
    });
    
    logger.debug('CONTEXT', 'User message added to history', { 
      historyLength: this.chatHistory.length 
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
   * Get optimized chat history with summarization for large conversations
   */
  async getOptimizedChatHistory(geminiClient?: any): Promise<Content[]> {
    if (!geminiClient || !this.conversationSummarizer.shouldSummarize(this.chatHistory)) {
      return this.getChatHistory();
    }

    try {
      const optimizedHistory = await this.conversationSummarizer.optimizeHistory(
        this.chatHistory, 
        geminiClient
      );
      
      logger.debug('CONTEXT', 'Using optimized chat history', {
        originalLength: this.chatHistory.length,
        optimizedLength: optimizedHistory.length
      });
      
      return optimizedHistory;
    } catch (error) {
      logger.warn('CONTEXT', 'Failed to optimize chat history, using original', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return this.getChatHistory();
    }
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

  /**
   * Check if project instructions are available
   */
  async hasProjectInstructions(): Promise<boolean> {
    return await ProjectInstructions.hasProjectInstructions();
  }

  /**
   * Get the path to project instructions file if it exists
   */
  async getProjectInstructionsPath(): Promise<string | null> {
    return await ProjectInstructions.getProjectInstructionsPath();
  }

  /**
   * Clear project instructions cache (useful for development/testing)
   */
  clearProjectInstructionsCache(): void {
    ProjectInstructions.clearCache();
  }

  /**
   * Configure conversation summarization settings
   */
  configureSummarization(config: Partial<import('./utils/conversation-summarizer').SummarizationConfig>): void {
    this.conversationSummarizer.updateConfig(config);
    logger.info('CONTEXT', 'Summarization configuration updated', { config });
  }

  /**
   * Clear conversation summary cache
   */
  clearSummaryCache(): void {
    this.conversationSummarizer.clearCache();
    logger.debug('CONTEXT', 'Summary cache cleared');
  }

  /**
   * Get conversation summarization statistics
   */
  getSummarizationStats(): { 
    shouldSummarize: boolean; 
    messageCount: number; 
    cacheStats: { entries: number; totalSize: number } 
  } {
    return {
      shouldSummarize: this.conversationSummarizer.shouldSummarize(this.chatHistory),
      messageCount: this.chatHistory.length,
      cacheStats: this.conversationSummarizer.getCacheStats()
    };
  }
}
