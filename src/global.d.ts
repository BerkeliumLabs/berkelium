/**
 * Global type declarations for Berkelium
 */

import type { ToolResult as _ToolResult } from './types/index';

declare global {
  interface ToolResult extends _ToolResult {}
}

// This export is required to make this file a module
export {};
