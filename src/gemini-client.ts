import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult, Content } from '@google/generative-ai';
import { toolDeclarations } from './tools/declarations';
import { logger } from './utils/logger';

/**
 * Manages the Gemini AI client and model interactions
 */
export class GeminiClient {
  private genAI!: GoogleGenerativeAI;
  private model!: GenerativeModel;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize the Gemini client and model
   */
  private initializeClient(): void {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error(
          'GEMINI_API_KEY environment variable is required. ' +
          'Please set it with your Google Gemini API key.'
        );
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
        systemInstruction: 'You are Berkelium, an intelligent AI coding assistant. You help developers with code-related tasks, explanations, debugging, and general programming questions. You have access to tools for reading files, writing files, and running shell commands. Use these tools when appropriate to help users with their requests. Be helpful, concise, and accurate in your responses.',
        tools: [{ functionDeclarations: toolDeclarations }]
      });

      logger.info('AI_CLIENT', 'Gemini AI client initialized successfully', { 
        model: 'gemini-2.0-flash-exp' 
      });
      // Don't log to console - only show success without details
      console.log('✅ Berkelium initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('AI_CLIENT', 'Failed to initialize Gemini AI client', { 
        error: errorMessage 
      });
      console.error('❌ Failed to initialize Berkelium:', errorMessage);
      process.exit(1);
    }
  }

  /**
   * Send a text prompt to Gemini and get response
   */
  async generateResponse(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.');
      }
      if (errorMessage.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      throw new Error(`Gemini API error: ${errorMessage}`);
    }
  }

  /**
   * Send content with conversation history to Gemini (supports function calling)
   */
  async generateContentWithHistory(contents: Content[]): Promise<GenerateContentResult> {
    try {
      logger.debug('AI_API', 'Sending request to Gemini', { 
        contentCount: contents.length,
        lastUserMessage: contents[contents.length - 1]?.parts?.[0]?.text?.substring(0, 100) + '...'
      });
      
      const result = await this.model.generateContent({ contents });
      
      logger.debug('AI_API', 'Received response from Gemini', { 
        hasResponse: !!result.response
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('AI_API', 'Gemini API request failed', { 
        error: errorMessage,
        contentCount: contents.length
      });
      
      if (errorMessage.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.');
      }
      if (errorMessage.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      throw new Error(`Gemini API error: ${errorMessage}`);
    }
  }

  /**
   * Get the model instance for advanced usage
   */
  getModel(): GenerativeModel {
    return this.model;
  }
}
