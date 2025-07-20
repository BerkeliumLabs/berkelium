import { writeFile, appendFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

/**
 * Logging levels for different types of messages
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

/**
 * Comprehensive logging system for Berkelium
 */
export class Logger {
  private static instance: Logger;
  private logEntries: LogEntry[] = [];
  private isFileLoggingEnabled: boolean = false;
  private logFilePath: string = '';
  private maxLogEntries: number = 1000;
  private showConsoleOutput: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Initialize file logging
   */
  async initializeFileLogging(logDirectory: string = './logs'): Promise<void> {
    try {
      await mkdir(logDirectory, { recursive: true });
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      this.logFilePath = join(logDirectory, `berkelium-${timestamp}.log`);
      this.isFileLoggingEnabled = true;
      
      // Only log initialization to file, not console
      this.info('LOGGER', 'File logging initialized', { logFilePath: this.logFilePath });
    } catch (error) {
      // Only show critical logging errors to console
      console.error('Failed to initialize file logging:', error);
    }
  }

  /**
   * Enable or disable console output for debugging
   */
  setConsoleOutput(enabled: boolean): void {
    this.showConsoleOutput = enabled;
  }

  /**
   * Log a message
   */
  private async log(level: LogLevel, category: string, message: string, data?: any): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data
    };

    // Add to in-memory log
    this.logEntries.push(entry);
    
    // Maintain maximum log entries
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.maxLogEntries);
    }

    // Console output
    this.outputToConsole(entry);

    // File output
    if (this.isFileLoggingEnabled) {
      await this.outputToFile(entry);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    // Only output to console if explicitly enabled or if it's an error/critical issue
    if (!this.showConsoleOutput && entry.level !== LogLevel.ERROR) {
      return;
    }

    const timestamp = entry.timestamp.toISOString();
    const dataStr = entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : '';
    const logLine = `[${timestamp}] ${entry.level} [${entry.category}] ${entry.message}${dataStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logLine);
        break;
      case LogLevel.INFO:
        console.log(logLine);
        break;
      case LogLevel.WARN:
        console.warn(logLine);
        break;
      case LogLevel.ERROR:
        console.error(logLine);
        break;
    }
  }

  /**
   * Output log entry to file
   */
  private async outputToFile(entry: LogEntry): Promise<void> {
    try {
      const timestamp = entry.timestamp.toISOString();
      const dataStr = entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : '';
      const logLine = `[${timestamp}] ${entry.level} [${entry.category}] ${entry.message}${dataStr}\n`;
      
      await appendFile(this.logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Debug level logging
   */
  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Info level logging
   */
  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  /**
   * Warning level logging
   */
  warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  /**
   * Error level logging
   */
  error(category: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logEntries.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logEntries.filter(entry => entry.level === level);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logEntries.filter(entry => entry.category === category);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logEntries = [];
  }

  /**
   * Export logs to file
   */
  async exportLogs(filePath: string): Promise<void> {
    try {
      const exportData = {
        exportTimestamp: new Date().toISOString(),
        totalEntries: this.logEntries.length,
        logs: this.logEntries
      };
      
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, JSON.stringify(exportData, null, 2));
      
      this.info('LOGGER', 'Logs exported successfully', { filePath, totalEntries: this.logEntries.length });
    } catch (error) {
      this.error('LOGGER', 'Failed to export logs', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Log AI interaction
   */
  logAIInteraction(userInput: string, aiResponse: string, toolsUsed: string[] = []): void {
    this.info('AI_INTERACTION', 'AI conversation turn', {
      userInputLength: userInput.length,
      aiResponseLength: aiResponse.length,
      toolsUsed,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log tool execution
   */
  logToolExecution(toolName: string, args: any, result: any, duration: number): void {
    this.info('TOOL_EXECUTION', `Tool executed: ${toolName}`, {
      toolName,
      args,
      success: result.success,
      errorMessage: result.error,
      outputLength: result.output?.length || 0,
      duration
    });
  }

  /**
   * Log system events
   */
  logSystemEvent(event: string, details?: any): void {
    this.info('SYSTEM', event, details);
  }

  /**
   * Show recent logs to user (when explicitly requested)
   */
  showLogsToUser(count: number = 20): void {
    const recentLogs = this.getRecentLogs(count);
    
    if (recentLogs.length === 0) {
      console.log('📝 No logs available.');
      return;
    }

    console.log(`\n📝 Recent Logs (last ${recentLogs.length} entries):\n`);
    
    recentLogs.forEach(entry => {
      const timestamp = entry.timestamp.toLocaleTimeString();
      const emoji = this.getLogEmoji(entry.level);
      const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
      
      console.log(`${emoji} ${timestamp} [${entry.category}] ${entry.message}${dataStr}`);
    });
    
    console.log(`\n📁 Full logs saved to: ${this.logFilePath}\n`);
  }

  /**
   * Show error logs to user (when explicitly requested)
   */
  showErrorLogsToUser(): void {
    const errorLogs = this.getLogsByLevel(LogLevel.ERROR);
    
    if (errorLogs.length === 0) {
      console.log('✅ No error logs found.');
      return;
    }

    console.log(`\n❌ Error Logs (${errorLogs.length} errors):\n`);
    
    errorLogs.forEach(entry => {
      const timestamp = entry.timestamp.toLocaleString();
      const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
      
      console.log(`🔴 ${timestamp} [${entry.category}] ${entry.message}${dataStr}`);
    });
    
    console.log(`\n📁 Full logs saved to: ${this.logFilePath}\n`);
  }

  /**
   * Get emoji for log level
   */
  private getLogEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      default: return '📝';
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
