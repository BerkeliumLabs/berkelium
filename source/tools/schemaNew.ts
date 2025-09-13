import {z} from 'zod';

// 1. Schema for list_directory (ReadFolder)
export const listDirectorySchema = z.object({
	path: z.string().describe('The absolute path to the directory to list'),
	ignore: z
		.array(z.string())
		.optional()
		.describe(
			"A list of glob patterns to exclude from the listing (e.g., ['*.log', '.git'])",
		),
	respect_git_ignore: z
		.boolean()
		.optional()
		.default(true)
		.describe('Whether to respect .gitignore patterns when listing files'),
});

// 2. Schema for read_file (ReadFile)
export const readFileSchema = z.object({
	path: z.string().describe('The absolute path to the file to read'),
	offset: z
		.number()
		.optional()
		.describe(
			'For text files, the 0-based line number to start reading from. Requires limit to be set',
		),
	limit: z
		.number()
		.optional()
		.describe(
			'For text files, the maximum number of lines to read. If omitted, reads a default maximum or the entire file',
		),
});

// 3. Schema for write_file (WriteFile)
export const writeFileSchema = z.object({
	file_path: z.string().describe('The absolute path to the file to write to'),
	content: z.string().describe('The content to write into the file'),
});

// 4. Schema for glob (FindFiles)
export const globSchema = z.object({
	pattern: z
		.string()
		.describe(
			"The glob pattern to match against (e.g., '*.py', 'src/**/*.js')",
		),
	path: z
		.string()
		.optional()
		.describe(
			"The absolute path to the directory to search within. If omitted, searches the tool's root directory",
		),
	case_sensitive: z
		.boolean()
		.optional()
		.default(false)
		.describe('Whether the search should be case-sensitive'),
	respect_git_ignore: z
		.boolean()
		.optional()
		.default(true)
		.describe('Whether to respect .gitignore patterns when finding files'),
});

// 5. Schema for search_file_content (SearchText)
export const searchFileContentSchema = z.object({
	pattern: z
		.string()
		.describe(
			"The regular expression (regex) to search for (e.g., 'function\\s+myFunction')",
		),
	path: z
		.string()
		.optional()
		.describe(
			'The absolute path to the directory to search within. Defaults to the current working directory',
		),
	include: z
		.string()
		.optional()
		.describe(
			"A glob pattern to filter which files are searched (e.g., '*.js', 'src/**/*.{ts,tsx}'). If omitted, searches most files",
		),
});

// 6. Schema for replace (Edit)
export const replaceSchema = z.object({
	file_path: z.string().describe('The absolute path to the file to modify'),
	old_string: z
		.string()
		.describe(
			'The exact literal text to replace. Must uniquely identify the instance to change. Should include context lines. If empty, creates a new file',
		),
	new_string: z
		.string()
		.describe('The exact literal text to replace old_string with'),
	expected_replacements: z
		.number()
		.optional()
		.default(1)
		.describe('The number of occurrences to replace'),
});

// Legacy schemas for backward compatibility (if needed)
export const createDirectorySchema = z.object({
	directoryPath: z.string().describe('The path to the directory to create'),
	recursive: z
		.boolean()
		.optional()
		.default(true)
		.describe("Whether to create parent directories if they don't exist"),
});

export const deleteFileSchema = z.object({
	filePath: z.string().describe('The path to the file to delete'),
});

// 7. Schema for run_shell_command
export const runShellCommandSchema = z.object({
	command: z.string().describe('The exact shell command to execute'),
	description: z
		.string()
		.optional()
		.describe(
			"A brief description of the command's purpose, which will be shown to the user",
		),
	directory: z
		.string()
		.optional()
		.describe(
			'The directory (relative to the project root) in which to execute the command. If not provided, the command runs in the project root',
		),
});

// Legacy schema for backward compatibility
export const runCommandSchema = z.object({
	command: z.string().describe('The shell command to execute'),
	workingDirectory: z
		.string()
		.optional()
		.describe('The working directory to run the command in (optional)'),
});
