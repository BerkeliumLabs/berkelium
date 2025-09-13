// Tool Executions
import { StructuredToolCallInput } from '@langchain/core/tools';
import { ToolCall } from '@langchain/core/messages/tool';
import { readFileTool, writeFileTool, listDirectoryTool, createDirectoryTool, deleteFileTool } from './index.js';
import usePermissionStore, { PermissionChoice } from '../store/permission.js';
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
 * Request permission for tool execution from the user
 */
async function requestPermission(toolCall: ToolCall): Promise<PermissionChoice> {
  const store = usePermissionStore.getState();

  // Check if permission was already granted for this session
  if (store.hasSessionPermission(toolCall.name)) {
    return 'allow_session';
  }

  return new Promise((resolve, reject) => {
    store.setToolCall(toolCall);
    store.setStatus('awaiting_permission');
    store.setPermissionPromise({ resolve, reject });
  });
}

/**
 * Execute the actual tool after permission is granted
 */
async function executeToolInternal(
  toolName: string,
  args: StructuredToolCallInput
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

/**
 * Execute a tool with user permission
 */
export async function executeTool(toolCall: ToolCall): Promise<any> {
  const store = usePermissionStore.getState();

  try {
    // Request permission for this tool execution
    const permission = await requestPermission(toolCall);

    if (permission === 'deny') {
      store.resetPermissionState();
      return {
        success: false,
        output: '',
        error: `User denied permission to execute ${toolCall.name}`
      };
    }

    // If permission granted for session, store it
    if (permission === 'allow_session') {
      store.addSessionPermission(toolCall.name);
    }

    // Set status to executing
    store.setStatus('executing');

    // Execute the tool
    const result = await executeToolInternal(toolCall.name, toolCall.args);

    // Reset permission state after execution
    store.resetPermissionState();

    return result;
  } catch (error) {
    store.resetPermissionState();
    throw error;
  }
}
