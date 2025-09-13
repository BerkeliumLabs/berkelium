import {z} from 'zod';

// Schema for reading files
export const readFileSchema = z.object({
	filePath: z.string().describe('The path to the file to read'),
});

// Schema for writing files
export const writeFileSchema = z.object({
	filePath: z.string().describe('The path to the file to write'),
	content: z.string().describe('The content to write to the file'),
	createDirectories: z
		.boolean()
		.optional()
		.default(true)
		.describe("Whether to create parent directories if they don't exist"),
});

// Schema for listing directories
export const listDirectorySchema = z.object({
	directoryPath: z.string().describe('The path to the directory to list'),
	showHidden: z
		.boolean()
		.optional()
		.default(false)
		.describe("Whether to show hidden files (files starting with '.')"),
});

// Schema for creating directories
export const createDirectorySchema = z.object({
	directoryPath: z.string().describe('The path to the directory to create'),
	recursive: z
		.boolean()
		.optional()
		.default(true)
		.describe("Whether to create parent directories if they don't exist"),
});

// Schema for deleting files
export const deleteFileSchema = z.object({
	filePath: z.string().describe('The path to the file to delete'),
});

// Schema for running shell commands
export const runCommandSchema = z.object({
	command: z.string().describe('The shell command to execute'),
	workingDirectory: z
		.string()
		.optional()
		.describe('The working directory to run the command in (optional)'),
});
