import {tool} from '@langchain/core/tools';
import {listDirectory} from './ls.js';
import {webFetch} from './webFetch.js';
import {runShellCommand} from './shell.js';
import {
	listDirectorySchema,
	readFileSchema,
	writeFileSchema,
	globSchema,
	searchFileContentSchema,
	replaceSchema,
	runShellCommandSchema,
	readManyFilesSchema,
	webFetchSchema,
	webSearchSchema,
	createFeatureBranchSchema,
	compressMemorySchema,
} from './schema.js';
import {readFile} from './readFile.js';
import {writeFile} from './writeFile.js';
import {glob} from './glob.js';
import {searchFileContent} from './grep.js';
import {replace} from './replace.js';
import {readManyFiles} from './multiFileReader.js';
import {webSearch} from './webSearch.js';
import {createFeatureBranch} from './createFeatureBranch.js';
import {compressMemory} from './compressMemory.js';
import usePermissionStore, {PermissionChoice} from '../store/permission.js';

/**
 * Tools that require user permission before execution
 */
const PERMISSION_REQUIRED_TOOLS = [
	'write_file',
	'replace',
	'run_shell_command',
	'web_fetch',
	'create_feature_branch',
];

/**
 * Request permission for tool execution from the user
 */
async function requestPermission(
	toolName: string,
	args: any,
): Promise<PermissionChoice> {
	const store = usePermissionStore.getState();

	// Check if permission was already granted for this session
	if (store.hasSessionPermission(toolName)) {
		return 'allow_session';
	}

	return new Promise((resolve, reject) => {
		const toolCall = {
			name: toolName,
			args,
			id: `${toolName}-${Date.now()}`,
		};

		store.setToolCall(toolCall);
		store.setStatus('awaiting_permission');
		store.setPermissionPromise({resolve, reject});

		// Add a timeout to prevent hanging indefinitely
		const timeoutId = setTimeout(() => {
			const currentStore = usePermissionStore.getState();
			if (currentStore.status === 'awaiting_permission') {
				currentStore.resetPermissionState();
				reject(new Error('Permission request timed out'));
			}
		}, 60000); // 60 second timeout

		// Clear timeout if promise resolves normally
		const originalResolve = resolve;
		const wrappedResolve = (choice: PermissionChoice) => {
			clearTimeout(timeoutId);
			originalResolve(choice);
		};

		const originalReject = reject;
		const wrappedReject = (error: Error) => {
			clearTimeout(timeoutId);
			originalReject(error);
		};

		// Update the promise in store with wrapped versions
		store.setPermissionPromise({
			resolve: wrappedResolve,
			reject: wrappedReject,
		});
	});
}

/**
 * Create a permission-aware wrapper for a tool function
 */
function withPermission<T extends (...args: any[]) => Promise<any>>(
	toolName: string,
	originalFunction: T,
): T {
	return (async (...args: any[]) => {
		const store = usePermissionStore.getState();

		try {
			// Check if this tool requires permission
			if (PERMISSION_REQUIRED_TOOLS.includes(toolName)) {
				// Request permission for this tool execution
				const permission = await requestPermission(toolName, args[0]);
				if (permission === 'deny') {
					store.resetPermissionState();
					return {
						success: false,
						output: '',
						error: `User denied permission to execute ${toolName}`,
					};
				}

				// If permission granted for session, store it
				if (permission === 'allow_session') {
					store.addSessionPermission(toolName);
				}

				// Set status to executing
				store.setStatus('executing');
			}

			// Execute the original function
			const result = await originalFunction(...args);

			// Reset permission state after execution (only if permission was required)
			if (PERMISSION_REQUIRED_TOOLS.includes(toolName)) {
				store.resetPermissionState();
			}

			return result;
		} catch (error) {
			// Reset permission state on error (only if permission was required)
			if (PERMISSION_REQUIRED_TOOLS.includes(toolName)) {
				store.resetPermissionState();
			}
			throw error;
		}
	}) as T;
}

// 1. list_directory (ReadFolder) - Lists files and directories
export const listDirectoryTool = tool(listDirectory, {
	name: 'list_directory',
	description:
		'List the names of files and subdirectories within a specified directory path. Can optionally ignore entries matching provided glob patterns.',
	schema: listDirectorySchema,
});

// 2. read_file (ReadFile) - Reads file content with support for images/PDFs
export const readFileTool = tool(readFile, {
	name: 'read_file',
	description:
		'Read and return the content of a specified file. Handles text, images (PNG, JPG, GIF, WEBP, SVG, BMP), and PDF files. For text files, can read specific line ranges.',
	schema: readFileSchema,
});

// 3. write_file (WriteFile) - Writes content to files
export const writeFileTool = tool(withPermission('write_file', writeFile), {
	name: 'write_file',
	description:
		"Write content to a specified file. If the file exists, it will be overwritten. If the file doesn't exist, it and any necessary parent directories will be created.",
	schema: writeFileSchema,
});

// 4. glob (FindFiles) - Finds files matching patterns
export const globTool = tool(glob, {
	name: 'glob',
	description:
		'Find files matching specific glob patterns (e.g., src/**/*.ts, *.md), returning absolute paths sorted by modification time (newest first).',
	schema: globSchema,
});

// 5. search_file_content (SearchText) - Searches within file contents
export const searchFileContentTool = tool(searchFileContent, {
	name: 'search_file_content',
	description:
		'Search for a regular expression pattern within the content of files in a specified directory. Can filter files by a glob pattern. Returns the lines containing matches.',
	schema: searchFileContentSchema,
});

// 6. replace (Edit) - Replaces text within files
export const replaceTool = tool(withPermission('replace', replace), {
	name: 'replace',
	description:
		'Replace text within a file. By default, replaces a single occurrence, but can replace multiple occurrences. Designed for precise, targeted changes requiring significant context.',
	schema: replaceSchema,
});

// 7. run_shell_command - Executes shell commands
export const runShellCommandTool = tool(withPermission('run_shell_command', runShellCommand), {
	name: 'run_shell_command',
	description:
		'Execute a shell command on the local system. Returns detailed information about the execution including command, directory, stdout, stderr, error, exit code, signal, and background PIDs. On Windows, commands are executed with cmd.exe /c. On other platforms, commands are executed with bash -c.',
	schema: runShellCommandSchema,
});

// 8. read_many_files - Multi-file reader
export const readManyFilesTool = tool(readManyFiles, {
	name: 'read_many_files',
	description:
		'Read content from multiple files specified by paths or glob patterns. Concatenates text files with separators and handles binary files (images, PDFs, audio, video) as base64. Supports include/exclude patterns and default exclusions.',
	schema: readManyFilesSchema,
});

// 9. web_fetch - Web content fetcher
export const webFetchTool = tool(withPermission('web_fetch', webFetch), {
	name: 'web_fetch',
	description:
		'Fetch and process content from web URLs embedded in a prompt. Extracts URLs from the prompt (up to 20) and fetches their content. Handles text-based content including HTML, JSON, XML. Returns formatted response with source attribution.',
	schema: webFetchSchema,
});

// 10. web_search - Web searcher
export const webSearchTool = tool(webSearch, {
	name: 'web_search',
	description:
		'Performs a web search using DuckDuckGo and returns the results.',
	schema: webSearchSchema,
});

// 11. create_feature_branch - Creates a feature branch with auto-incrementing number
export const createFeatureBranchTool = tool(withPermission('create_feature_branch', createFeatureBranch), {
	name: 'create_feature_branch',
	description:
		'Creates a new feature branch with auto-incrementing number, switches to it, and creates a corresponding specs directory. Generates branch names from feature descriptions.',
	schema: createFeatureBranchSchema,
});

// 12. compress_memory - Compresses conversation memory to save tokens
export const compressMemoryTool = tool(compressMemory, {
	name: 'compress_memory',
	description:
		'Compresses the current conversation memory by creating a comprehensive summary and replacing the full conversation history with it. This saves tokens while preserving important context for future interactions.',
	schema: compressMemorySchema,
});

export const tools = [
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
	createFeatureBranchTool,
	compressMemoryTool,
];
