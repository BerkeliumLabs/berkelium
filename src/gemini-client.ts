import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult, Content } from '@google/generative-ai';
import { toolDeclarations } from './tools/declarations';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface Config {
  version: string;
  createdAt: string;
  updatedAt: string;
  geminiApiKey: string;
}

/**
 * Manages the Gemini AI client and model interactions
 */
export class GeminiClient {
  private genAI!: GoogleGenerativeAI;
  private model!: GenerativeModel;
  private configPath: string;

  constructor() {
    this.configPath = path.join(os.homedir(), 'config.json');
    this.initializeClient();
  }

  /**
   * Load configuration from config.json in user's home directory
   */
  private loadConfig(): Config {
    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(
          `Configuration file not found at ${this.configPath}. ` +
          'Please create a config.json file in your home directory with your Gemini API key.'
        );
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config: Config = JSON.parse(configData);

      if (!config.geminiApiKey) {
        throw new Error(
          'geminiApiKey is missing from config.json. ' +
          'Please add your Google Gemini API key to the configuration file.'
        );
      }

      return config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in config file at ${this.configPath}. Please check the file format.`);
      }
      throw error;
    }
  }

  /**
   * Initialize the Gemini client and model
   */
  private initializeClient(): void {
    try {
      const config = this.loadConfig();
      const apiKey = config.geminiApiKey;

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
      console.log('✅ Berkelium initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
        throw new Error('Invalid Gemini API key. Please check your config.json file.');
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
      const result = await this.model.generateContent({ contents });     
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key. Please check your config.json file.');
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
