#!/usr/bin/env node

import { input } from '@inquirer/prompts';
import { GeminiClient } from './gemini-client';
import { ContextManager } from './context-manager';
import { executeTool, ToolName } from './tools';
import { FunctionCall } from '@google/generative-ai';
import { ProgressIndicator } from './utils/progress';
import { ErrorHandler, ErrorCategory } from './utils/error-handler';
import { logger } from './utils/logger';

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
    
    // Initialize logging
    logger.initializeFileLogging().catch(console.error);
    logger.logSystemEvent('Berkelium CLI started');
  }

  /**
   * Start the REPL loop
   */
  async start(): Promise<void> {
    console.log('🧪 Welcome to Berkelium - Agentic AI Code Assistant');
    console.log('Type your questions or commands. Use "help" for available commands, "exit" or "quit" to leave.\n');

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

        // Handle special commands
        if (this.handleSpecialCommands(userInput)) {
          continue;
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
   * Handle special built-in commands
   */
  private handleSpecialCommands(input: string): boolean {
    const trimmed = input.trim().toLowerCase();
    
    switch (trimmed) {
      case 'show logs':
      case 'logs':
        logger.showLogsToUser();
        return true;
        
      case 'show errors':
      case 'errors':
        logger.showErrorLogsToUser();
        return true;
        
      case 'enable debug':
      case 'debug on':
        logger.setConsoleOutput(true);
        console.log('🔍 Debug logging enabled - logs will now appear in console');
        return true;
        
      case 'disable debug':
      case 'debug off':
        logger.setConsoleOutput(false);
        console.log('🔇 Debug logging disabled - logs will only be saved to file');
        return true;

      case 'show project':
      case 'project info':
        this.showProjectInfo();
        return true;

      case 'clear project cache':
        this.contextManager.clearProjectInstructionsCache();
        console.log('🗑️ Project instructions cache cleared');
        return true;
        
      case 'help':
        this.showHelp();
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Show project information and instructions status
   */
  async showProjectInfo(): Promise<void> {
    console.log('\n📋 Project Information:');
    console.log(`Working Directory: ${process.cwd()}`);
    
    try {
      const hasInstructions = await this.contextManager.hasProjectInstructions();
      const instructionsPath = await this.contextManager.getProjectInstructionsPath();
      
      if (hasInstructions && instructionsPath) {
        console.log(`✅ Project Instructions: Found at ${instructionsPath}`);
        console.log('📝 Instructions will be automatically included in AI context');
      } else {
        console.log('❌ Project Instructions: Not found');
        console.log('💡 To add project instructions:');
        console.log('   1. Create a .berkelium folder in your project root');
        console.log('   2. Add a BERKELIUM.md file with your project guidelines');
        console.log('   3. The instructions will be automatically included in all AI interactions');
      }
    } catch (error) {
      console.log('❌ Error checking project instructions:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log('');
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
🧪 Berkelium - Agentic AI Code Assistant

Available Commands:
  • Type any question or request for AI assistance
  • logs, show logs       - View recent log entries
  • errors, show errors   - View error logs only
  • debug on             - Enable debug console output
  • debug off            - Disable debug console output
  • project info         - Show project instructions status
  • clear project cache  - Clear project instructions cache
  • help                 - Show this help message
  • exit, quit           - Exit Berkelium

Special Syntax:
  • @filename            - Include file content in your message
  • Automatic context    - Relevant files are included automatically
  • Project instructions - BERKELIUM.md files are auto-included

Project Instructions:
  Create a .berkelium/BERKELIUM.md file in your project root to provide
  project-specific guidelines that will be included in every AI interaction.

Examples:
  > Read the package.json file
  > Create a new Express server in server.js
  > @src/main.ts explain this file
  > project info
    `);
  }

  /**
   * Handle user input by sending it to Gemini and processing any tool calls
   */
  private async handleUserInput(userInput: string): Promise<void> {
    try {
      logger.debug('USER_INPUT', 'Processing user input', { inputLength: userInput.length });
      
      // Add user message to history with auto-context
      await this.contextManager.addUserMessage(userInput);

      await this.runAgenticLoop();
    } catch (error) {
      const berkeliumError = ErrorHandler.handle(error, ErrorCategory.USER_INPUT_ERROR);
      logger.error('USER_INPUT', 'Failed to handle user input', { error: berkeliumError.message });
      console.error(ErrorHandler.getUserFriendlyMessage(berkeliumError));
    }
  }

  /**
   * Core agentic loop that handles AI responses and tool execution
   */
  private async runAgenticLoop(): Promise<void> {
    let maxIterations = 10; // Prevent infinite loops
    const progress = new ProgressIndicator();
    
    logger.debug('AGENTIC_LOOP', 'Starting agentic loop', { maxIterations });
    
    while (maxIterations > 0) {
      logger.debug('AGENTIC_LOOP', `Starting iteration`, { 
        iteration: 11 - maxIterations, 
        remainingIterations: maxIterations 
      });
      
      progress.start('Thinking');
      
      try {
        // Get response from Gemini with conversation history
        const result = await this.geminiClient.generateContentWithHistory(
          this.contextManager.getChatHistory()
        );
        
        progress.stop();
        
        const response = await result.response;
        const responseParts = response.candidates?.[0]?.content?.parts || [];
        
        logger.debug('AI_RESPONSE', 'Received AI response', { 
          partCount: responseParts.length,
          hasText: responseParts.some(part => part.text),
          hasFunctionCalls: responseParts.some(part => part.functionCall)
        });
        
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
            logger.info('AI_RESPONSE', 'AI provided text response without function calls', { 
              responseLength: text.length 
            });
          }
          break;
        }
        
        logger.info('TOOL_EXECUTION', 'Executing function calls', { 
          functionCallCount: functionCalls.length 
        });
        
        // Execute each function call
        for (const part of functionCalls) {
          if (part.functionCall) {
            await this.executeFunctionCall(part.functionCall);
          }
        }
      } catch (error) {
        progress.stop();
        const berkeliumError = ErrorHandler.handle(error, ErrorCategory.API_ERROR);
        logger.error('AGENTIC_LOOP', 'Error in agentic loop iteration', { 
          iteration: 11 - maxIterations,
          error: berkeliumError.message 
        });
        console.error(ErrorHandler.getUserFriendlyMessage(berkeliumError));
        break;
      }
      
      maxIterations--;
    }
    
    if (maxIterations === 0) {
      logger.warn('AGENTIC_LOOP', 'Maximum iterations reached');
      console.log('\n⚠️ Maximum iterations reached. Stopping agentic loop.\n');
    }
    
    logger.debug('AGENTIC_LOOP', 'Agentic loop completed');
  }

  /**
   * Execute a function call and add the result to conversation history
   */
  private async executeFunctionCall(functionCall: FunctionCall): Promise<void> {
    const progress = new ProgressIndicator();
    
    logger.debug('TOOL_EXECUTION', `Starting function execution: ${functionCall.name}`, { 
      args: functionCall.args 
    });
    
    try {
      const { name: functionName, args } = functionCall;
      
      progress.start(`Executing ${functionName}`);
      
      // Execute the tool
      const result = await executeTool(functionName as ToolName, args || {});
      
      progress.stop();
      
      logger.info('TOOL_EXECUTION', `Function ${functionName} executed`, { 
        success: result.success,
        hasOutput: !!result.output,
        outputLength: result.output?.length || 0
      });
      
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
      const berkeliumError = ErrorHandler.handle(error, ErrorCategory.TOOL_ERROR, {
        functionName: functionCall.name,
        args: functionCall.args
      });
      
      logger.error('TOOL_EXECUTION', `Function ${functionCall.name} failed with error`, { 
        error: berkeliumError.message,
        args: functionCall.args
      });
      
      console.error(ErrorHandler.getUserFriendlyMessage(berkeliumError));
      
      // Add error response to history
      this.contextManager.addFunctionResponse(functionCall.name, {
        success: false,
        output: '',
        error: berkeliumError.message
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
