/**
 * Global type definitions for Berkelium
 */

declare global {
  /**
   * Standard result interface for tool operations
   */
  interface ToolResult {
    success: boolean;
    output: string;
    error?: string;
  }
}

// This export is required to make this file a module
export {};
