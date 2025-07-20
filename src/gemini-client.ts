import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

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
        systemInstruction: 'You are Berkelium, an intelligent AI coding assistant. You help developers with code-related tasks, explanations, debugging, and general programming questions. Be helpful, concise, and accurate in your responses.'
      });

      console.log('✅ Gemini AI client initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to initialize Gemini AI client:', errorMessage);
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
   * Get the model instance for advanced usage
   */
  getModel(): GenerativeModel {
    return this.model;
  }
}
