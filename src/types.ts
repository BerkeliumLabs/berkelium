/**
 * Global type definitions for Berkelium
 */

/**
 * Standard result interface for tool operations
 */
export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}
