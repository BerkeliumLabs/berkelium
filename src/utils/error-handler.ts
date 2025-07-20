/**
 * Comprehensive error handling and reporting system
 */

export enum ErrorCategory {
  API_ERROR = 'API_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  SHELL_ERROR = 'SHELL_ERROR',
  CONTEXT_ERROR = 'CONTEXT_ERROR',
  USER_INPUT_ERROR = 'USER_INPUT_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  TOOL_ERROR = 'TOOL_ERROR'
}

export interface ErrorDetails {
  category: ErrorCategory;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
  stack?: string;
}

export class BerkeliumError extends Error {
  public readonly category: ErrorCategory;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    category: ErrorCategory,
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'BerkeliumError';
    this.category = category;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date();

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BerkeliumError);
    }
  }

  toErrorDetails(): ErrorDetails {
    return {
      category: this.category,
      message: this.message,
      originalError: this.originalError,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export class ErrorHandler {
  private static errorLog: ErrorDetails[] = [];

  /**
   * Handle and log an error
   */
  static handle(error: unknown, category?: ErrorCategory, context?: Record<string, any>): BerkeliumError {
    let berkeliumError: BerkeliumError;

    if (error instanceof BerkeliumError) {
      berkeliumError = error;
    } else if (error instanceof Error) {
      berkeliumError = new BerkeliumError(
        category || this.categorizeError(error),
        error.message,
        error,
        context
      );
    } else {
      berkeliumError = new BerkeliumError(
        category || ErrorCategory.SYSTEM_ERROR,
        String(error),
        undefined,
        context
      );
    }

    // Log the error
    this.logError(berkeliumError.toErrorDetails());

    return berkeliumError;
  }

  /**
   * Log an error to the error log
   */
  private static logError(errorDetails: ErrorDetails): void {
    this.errorLog.push(errorDetails);
    
    // Keep only the last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }

  /**
   * Automatically categorize an error based on its message
   */
  private static categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    
    if (message.includes('api') || message.includes('gemini') || message.includes('rate limit')) {
      return ErrorCategory.API_ERROR;
    }
    if (message.includes('enoent') || message.includes('eacces') || message.includes('file') || message.includes('directory')) {
      return ErrorCategory.FILE_SYSTEM_ERROR;
    }
    if (message.includes('command') || message.includes('exec') || message.includes('spawn')) {
      return ErrorCategory.SHELL_ERROR;
    }
    if (message.includes('context') || message.includes('parsing')) {
      return ErrorCategory.CONTEXT_ERROR;
    }
    if (message.includes('tool') || message.includes('function')) {
      return ErrorCategory.TOOL_ERROR;
    }
    
    return ErrorCategory.SYSTEM_ERROR;
  }

  /**
   * Get recent errors
   */
  static getRecentErrors(count: number = 10): ErrorDetails[] {
    return this.errorLog.slice(-count);
  }

  /**
   * Get errors by category
   */
  static getErrorsByCategory(category: ErrorCategory): ErrorDetails[] {
    return this.errorLog.filter(error => error.category === category);
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: BerkeliumError): string {
    switch (error.category) {
      case ErrorCategory.API_ERROR:
        return `🔌 API Error: ${error.message}. Please check your API key and connection.`;
      case ErrorCategory.FILE_SYSTEM_ERROR:
        return `📁 File System Error: ${error.message}. Please check file paths and permissions.`;
      case ErrorCategory.SHELL_ERROR:
        return `💻 Command Error: ${error.message}. Please check the command syntax.`;
      case ErrorCategory.CONTEXT_ERROR:
        return `📎 Context Error: ${error.message}. Please check file references.`;
      case ErrorCategory.USER_INPUT_ERROR:
        return `⌨️ Input Error: ${error.message}. Please check your input format.`;
      case ErrorCategory.TOOL_ERROR:
        return `🔧 Tool Error: ${error.message}. The operation could not be completed.`;
      default:
        return `❌ System Error: ${error.message}. Please try again.`;
    }
  }

  /**
   * Create error report for AI context
   */
  static createErrorReport(error: BerkeliumError): string {
    const details = error.toErrorDetails();
    return `Error Report:
Category: ${details.category}
Message: ${details.message}
Timestamp: ${details.timestamp.toISOString()}
Context: ${details.context ? JSON.stringify(details.context, null, 2) : 'None'}`;
  }
}
