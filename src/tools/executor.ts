// Tool Executions
import { readFileTool, writeFileTool, listDirectoryTool, createDirectoryTool, deleteFileTool } from './index.js';
/* import { webSearch } from './webSearch.js'; */

/**
 * Registry of available tools
 */
export const availableTools = {
  readFile: readFileTool,
  writeFile: writeFileTool,
  listDirectory: listDirectoryTool,
  createDirectory: createDirectoryTool,
  deleteFile: deleteFileTool
};

/**
 * Execute a tool by name with given arguments
 */
export async function executeTool(
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  switch (toolName) {
    case 'readFile':
      return await readFileTool.invoke(args);
    
    case 'writeFile':
      return await writeFileTool.invoke(args);
    
    case 'listDirectory':
      return await listDirectoryTool.invoke(args);
    
    case 'createDirectory':
      return await createDirectoryTool.invoke(args);
    
    case 'deleteFile':
      return await deleteFileTool.invoke(args);

    /* case 'webSearch':
      return webSearch(args.query, args.maxResults); */
    
    default:
      return {
        success: false,
        output: '',
        error: `Unknown tool: ${toolName}`
      };
  }
}
