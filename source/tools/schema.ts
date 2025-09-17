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

// 8. Schema for read_many_files
export const readManyFilesSchema = z.object({
	paths: z
		.array(z.string())
		.describe(
			'An array of glob patterns or paths relative to the tool\'s target directory (e.g., ["src/**/*.ts"], ["README.md", "docs/*", "assets/logo.png"])',
		),
	exclude: z
		.array(z.string())
		.optional()
		.describe(
			'Glob patterns for files/directories to exclude (e.g., ["**/*.log", "temp/"]). These are added to default excludes if useDefaultExcludes is true',
		),
	include: z
		.array(z.string())
		.optional()
		.describe(
			'Additional glob patterns to include. These are merged with paths (e.g., ["*.test.ts"] to specifically add test files if they were broadly excluded, or ["images/*.jpg"] to include specific image types)',
		),
	recursive: z
		.boolean()
		.optional()
		.default(true)
		.describe(
			'Whether to search recursively. This is primarily controlled by ** in glob patterns',
		),
	useDefaultExcludes: z
		.boolean()
		.optional()
		.default(true)
		.describe(
			'Whether to apply a list of default exclusion patterns (e.g., node_modules, .git, non image/pdf binary files)',
		),
	respect_git_ignore: z
		.boolean()
		.optional()
		.default(true)
		.describe('Whether to respect .gitignore patterns when finding files'),
});

// 9. Schema for web_fetch
export const webFetchSchema = z.object({
	prompt: z
		.string()
		.describe(
			'A comprehensive prompt that includes the URL(s) (up to 20) to fetch and specific instructions on how to process their content. For example: "Summarize https://example.com/article and extract key points from https://another.com/data". The prompt must contain at least one URL starting with http:// or https://',
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

// 10. Schema for web_search
export const webSearchSchema = z.object({
	query: z.string().describe('The query to search the web for.'),
});

// 11. Schema for create_feature_branch
export const createFeatureBranchSchema = z.object({
	feature_description: z.string().describe('A summarized feature name for the feature description that the user provides'),
	json_mode: z
		.boolean()
		.optional()
		.default(false)
		.describe('Whether to output results in JSON format instead of legacy key: value format'),
});

// 12. Schema for compress_memory
export const compressMemorySchema = z.object({
	thread_id: z.string().optional().describe('The thread ID for the current conversation to compress. If not provided, uses the current active thread.'),
});
