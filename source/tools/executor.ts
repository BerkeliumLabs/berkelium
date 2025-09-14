// Tool Executions
import {StructuredToolCallInput} from '@langchain/core/tools';
import {ToolCall} from '@langchain/core/messages/tool';
import {
	listDirectoryTool,
	readFileTool,
	writeFileTool,
	globTool,
	searchFileContentTool,
	replaceTool,
	runShellCommandTool,
	readManyFilesTool,
	webFetchTool,
	webSearchTool,
} from './index.js';
import usePermissionStore, {PermissionChoice} from '../store/permission.js';
/* import { webSearch } from './webSearch.js'; */

/**
 * Registry of available tools
 */
export const availableTools = {
	list_directory: listDirectoryTool,
	read_file: readFileTool,
	write_file: writeFileTool,
	glob: globTool,
	search_file_content: searchFileContentTool,
	replace: replaceTool,
	run_shell_command: runShellCommandTool,
	read_many_files: readManyFilesTool,
	web_fetch: webFetchTool,
	web_search: webSearchTool,
};

/**
 * Tools that require user permission before execution
 */
const PERMISSION_REQUIRED_TOOLS = [
	'write_file',
	'replace',
	'run_shell_command',
	'web_fetch',
];

/**
 * Request permission for tool execution from the user
 */
async function requestPermission(
	toolCall: ToolCall,
): Promise<PermissionChoice> {
	const store = usePermissionStore.getState();

	// Check if permission was already granted for this session
	if (store.hasSessionPermission(toolCall.name)) {
		return 'allow_session';
	}

	return new Promise((resolve, reject) => {
		// Use setTimeout to ensure the state updates happen in the next tick
		setTimeout(() => {
			store.setToolCall(toolCall);
			store.setStatus('awaiting_permission');
			store.setPermissionPromise({resolve, reject});
		}, 0);
	});
}

/**
 * Execute the actual tool after permission is granted
 */
async function executeToolInternal(
	toolName: string,
	args: StructuredToolCallInput,
): Promise<any> {
	switch (toolName) {
		case 'list_directory':
			return await listDirectoryTool.invoke(args);

		case 'read_file':
			return await readFileTool.invoke(args);

		case 'write_file':
			return await writeFileTool.invoke(args);

		case 'glob':
			return await globTool.invoke(args);

		case 'search_file_content':
			return await searchFileContentTool.invoke(args);

		case 'replace':
			return await replaceTool.invoke(args);

		case 'run_shell_command':
			return await runShellCommandTool.invoke(args);

		case 'read_many_files':
			return await readManyFilesTool.invoke(args);

		case 'web_fetch':
			return await webFetchTool.invoke(args);

		case 'web_search':
			return await webSearchTool.invoke(args);

		default:
			return {
				success: false,
				output: '',
				error: `Unknown tool: ${toolName}`,
			};
	}
}

/**
 * Execute a tool with user permission
 */
export async function executeTool(toolCall: ToolCall): Promise<any> {
	const store = usePermissionStore.getState();

	try {
		// Check if this tool requires permission
		const requiresPermission = PERMISSION_REQUIRED_TOOLS.includes(
			toolCall.name,
		);

		if (requiresPermission) {
			// Request permission for this tool execution
			const permission = await requestPermission(toolCall);

			if (permission === 'deny') {
				store.resetPermissionState();
				return {
					success: false,
					output: '',
					error: `User denied permission to execute ${toolCall.name}`,
				};
			}

			// If permission granted for session, store it
			if (permission === 'allow_session') {
				store.addSessionPermission(toolCall.name);
			}

			// Set status to executing
			store.setStatus('executing');
		}

		// Execute the tool
		const result = await executeToolInternal(toolCall.name, toolCall.args);

		// Reset permission state after execution (only if permission was required)
		if (requiresPermission) {
			store.resetPermissionState();
		}

		return result;
	} catch (error) {
		// Reset permission state on error (only if permission was required)
		if (PERMISSION_REQUIRED_TOOLS.includes(toolCall.name)) {
			store.resetPermissionState();
		}
		throw error;
	}
}
