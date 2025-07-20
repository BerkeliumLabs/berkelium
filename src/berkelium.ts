#!/usr/bin/env node

import { input } from '@inquirer/prompts';
import { GeminiClient } from './gemini-client';
import { ContextManager } from './context-manager';

/**
 * Main Berkelium CLI application
 */
class BerkeliumCLI {
  private isRunning: boolean = true;
  private geminiClient: GeminiClient;
  private contextManager: ContextManager;

  constructor() {
    this.geminiClient = new GeminiClient();
    this.contextManager = new ContextManager();
  }

  /**
   * Start the REPL loop
   */
  async start(): Promise<void> {
    console.log('🧪 Welcome to Berkelium - Agentic AI Code Assistant');
    console.log('Type your questions or commands. Use "exit" or "quit" to leave.\n');

    while (this.isRunning) {
      try {
        const userInput = await input({
          message: '> ',
        });

        // Handle exit commands
        if (this.shouldExit(userInput)) {
          this.exit();
          break;
        }

        // Send prompt to Gemini and display response
        await this.handleUserInput(userInput);

      } catch (error) {
        if (error instanceof Error && error.name === 'ExitPromptError') {
          // User pressed Ctrl+C
          this.exit();
          break;
        }
        console.error('An error occurred:', error);
      }
    }
  }

  /**
   * Handle user input by sending it to Gemini
   */
  private async handleUserInput(userInput: string): Promise<void> {
    try {
      // Add user message to history
      this.contextManager.addUserMessage(userInput);

      console.log('🤔 Thinking...');
      
      // Build context-aware prompt
      const conversationContext = this.contextManager.getConversationContext();
      const promptWithContext = conversationContext 
        ? `Previous conversation:\n${conversationContext}\n\nCurrent question: ${userInput}`
        : userInput;

      const response = await this.geminiClient.generateResponse(promptWithContext);
      
      // Add assistant response to history
      this.contextManager.addAssistantMessage(response);
      
      console.log(`\n🧪 Berkelium: ${response}\n`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error: ${errorMessage}\n`);
    }
  }

  /**
   * Check if the user wants to exit
   */
  private shouldExit(input: string): boolean {
    const trimmed = input.trim().toLowerCase();
    return trimmed === 'exit' || trimmed === 'quit';
  }

  /**
   * Gracefully exit the application
   */
  private exit(): void {
    console.log('\n👋 Goodbye! Thanks for using Berkelium.');
    this.isRunning = false;
    process.exit(0);
  }
}

// Start the application
if (require.main === module) {
  const cli = new BerkeliumCLI();
  cli.start().catch((error) => {
    console.error('Failed to start Berkelium:', error);
    process.exit(1);
  });
}

export default BerkeliumCLI;
