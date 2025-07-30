// Tool Executions
import { writeFileTool } from './index.js';
/* import { webSearch } from './webSearch.js'; */

/**
 * Registry of available tools
 */
export const availableTools = {
  writeFile: writeFileTool
};

/**
 * Execute a tool by name with given arguments
 */
export async function executeTool(
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  switch (toolName) {
    case 'writeFile':
      return await writeFileTool.invoke(args);

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
