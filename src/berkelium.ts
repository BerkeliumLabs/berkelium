#!/usr/bin/env node

import { input } from '@inquirer/prompts';
import { GeminiClient } from './gemini-client';
import { ContextManager } from './context-manager';
import { executeTool, ToolName } from './tools';
import { FunctionCall } from '@google/generative-ai';
import { ProgressIndicator } from './utils/progress';

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
   * Handle user input by sending it to Gemini and processing any tool calls
   */
  private async handleUserInput(userInput: string): Promise<void> {
    try {
      // Add user message to history
      this.contextManager.addUserMessage(userInput);

      await this.runAgenticLoop();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error: ${errorMessage}\n`);
    }
  }

  /**
   * Core agentic loop that handles AI responses and tool execution
   */
  private async runAgenticLoop(): Promise<void> {
    let maxIterations = 10; // Prevent infinite loops
    const progress = new ProgressIndicator();
    
    while (maxIterations > 0) {
      progress.start('Thinking');
      
      try {
        // Get response from Gemini with conversation history
        const result = await this.geminiClient.generateContentWithHistory(
          this.contextManager.getChatHistory()
        );
        
        progress.stop();
        
        const response = await result.response;
        const responseParts = response.candidates?.[0]?.content?.parts || [];
        
        // Add the model's response to history
        this.contextManager.addModelMessage(responseParts);
        
        // Check if there are any function calls to execute
        const functionCalls = responseParts.filter(part => part.functionCall);
        
        if (functionCalls.length === 0) {
          // No function calls, display the text response and exit loop
          const textParts = responseParts.filter(part => part.text);
          if (textParts.length > 0) {
            const text = textParts.map(part => part.text).join('');
            console.log(`\n🧪 Berkelium: ${text}\n`);
          }
          break;
        }
        
        // Execute each function call
        for (const part of functionCalls) {
          if (part.functionCall) {
            await this.executeFunctionCall(part.functionCall);
          }
        }
      } catch (error) {
        progress.stop();
        throw error;
      }
      
      maxIterations--;
    }
    
    if (maxIterations === 0) {
      console.log('\n⚠️ Maximum iterations reached. Stopping agentic loop.\n');
    }
  }

  /**
   * Execute a function call and add the result to conversation history
   */
  private async executeFunctionCall(functionCall: FunctionCall): Promise<void> {
    const progress = new ProgressIndicator();
    
    try {
      const { name: functionName, args } = functionCall;
      
      progress.start(`Executing ${functionName}`);
      
      // Execute the tool
      const result = await executeTool(functionName as ToolName, args || {});
      
      progress.stop();
      
      // Add function response to history
      this.contextManager.addFunctionResponse(functionName, result);
      
      // Display tool execution result
      if (result.success) {
        console.log(`✅ ${functionName} executed successfully`);
        if (result.output) {
          console.log(`📄 Output: ${result.output.substring(0, 200)}${result.output.length > 200 ? '...' : ''}`);
        }
      } else {
        console.log(`❌ ${functionName} execution failed: ${result.error}`);
      }
    } catch (error) {
      progress.stop();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Function execution error: ${errorMessage}`);
      
      // Add error response to history
      this.contextManager.addFunctionResponse(functionCall.name, {
        success: false,
        output: '',
        error: errorMessage
      });
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
