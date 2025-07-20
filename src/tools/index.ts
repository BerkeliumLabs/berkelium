// Tool declarations
export * from './declarations';

// File system tools
export * from './fileSystem';

// Shell tools
export * from './shell';

// Tool registry for easy access
import { readFile, writeFile } from './fileSystem';
import { runCommand } from './shell';
import { ToolName, ToolResult } from './declarations';

/**
 * Registry of available tools
 */
export const availableTools = {
  readFile,
  writeFile,
  runCommand
};

/**
 * Execute a tool by name with given arguments
 */
export async function executeTool(
  toolName: ToolName,
  args: Record<string, any>
): Promise<ToolResult> {
  switch (toolName) {
    case 'readFile':
      return readFile(args.filePath);
    
    case 'writeFile':
      return writeFile(
        args.filePath, 
        args.content, 
        args.createDirectories ?? true
      );
    
    case 'runCommand':
      return runCommand(args.command, args.workingDirectory);
    
    default:
      return {
        success: false,
        output: '',
        error: `Unknown tool: ${toolName}`
      };
  }
}
