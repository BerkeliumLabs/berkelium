import {tool} from '@langchain/core/tools';
import {
	listDirectory,
	readFile,
	writeFile,
	glob,
	searchFileContent,
	replace,
	readManyFiles,
} from './fileSystemNew.js';
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
} from './schemaNew.js';

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
export const writeFileTool = tool(writeFile, {
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
export const replaceTool = tool(replace, {
	name: 'replace',
	description:
		'Replace text within a file. By default, replaces a single occurrence, but can replace multiple occurrences. Designed for precise, targeted changes requiring significant context.',
	schema: replaceSchema,
});

// 7. run_shell_command - Executes shell commands
export const runShellCommandTool = tool(runShellCommand, {
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

export const tools = [
	listDirectoryTool,
	readFileTool,
	writeFileTool,
	globTool,
	searchFileContentTool,
	replaceTool,
	runShellCommandTool,
	readManyFilesTool,
];
