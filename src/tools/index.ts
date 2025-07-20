// Tool declarations
export * from './declarations';

// File system tools
export * from './fileSystem';

// Shell tools
export * from './shell';

// Web search tools
export * from './webSearch';

// Tool registry for easy access
import { readFile, writeFile, listDirectory, createDirectory, deleteFile } from './fileSystem';
import { runCommand } from './shell';
import { webSearch } from './webSearch';
import { ToolName, ToolResult } from './declarations';

/**
 * Registry of available tools
 */
export const availableTools = {
  readFile,
  writeFile,
  listDirectory,
  createDirectory,
  deleteFile,
  runCommand,
  webSearch
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
    
    case 'listDirectory':
      return listDirectory(
        args.directoryPath,
        args.showHidden ?? false
      );
    
    case 'createDirectory':
      return createDirectory(
        args.directoryPath,
        args.recursive ?? true
      );
    
    case 'deleteFile':
      return deleteFile(args.filePath);
    
    case 'runCommand':
      return runCommand(args.command, args.workingDirectory);
    
    case 'webSearch':
      return webSearch(args.query, args.maxResults);
    
    default:
      return {
        success: false,
        output: '',
        error: `Unknown tool: ${toolName}`
      };
  }
}
