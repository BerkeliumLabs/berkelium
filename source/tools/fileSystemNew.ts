import {
	readFile as fsReadFile,
	writeFile as fsWriteFile,
	access,
	mkdir,
	readdir,
	stat,
	unlink,
} from 'fs/promises';
import {constants} from 'fs';
import {resolve, dirname, join, relative} from 'path';
import {glob as globPattern} from 'glob';
import {execSync, exec} from 'child_process';
import {promisify} from 'util';
import useProgressStore from '../store/progress.js';

const execAsync = promisify(exec);

export interface ToolResult {
	success: boolean;
	output: string;
	error?: string;
}

/**
 * 1. list_directory (ReadFolder)
 * Lists the names of files and subdirectories within a specified directory path
 */
export async function listDirectory(args: {
	path: string;
	ignore?: string[];
	respect_git_ignore?: boolean;
}): Promise<ToolResult> {
	const {path: dirPath, ignore = [], respect_git_ignore = true} = args;

	try {
		const resolvedPath = resolve(dirPath);
		await access(resolvedPath, constants.F_OK | constants.R_OK);

		let entries = await readdir(resolvedPath);

		// Apply ignore patterns
		if (ignore.length > 0) {
			entries = entries.filter(entry => {
				return !ignore.some(pattern => {
					// Simple glob pattern matching
					const regex = new RegExp(
						pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
					);
					return regex.test(entry);
				});
			});
		}

		// Apply gitignore if requested
		if (respect_git_ignore) {
			entries = entries.filter(entry => {
				// Basic gitignore patterns - exclude common ignored items
				const commonIgnored = [
					'.git',
					'node_modules',
					'.DS_Store',
					'*.tmp',
					'*.log',
				];
				return !commonIgnored.some(pattern => {
					const regex = new RegExp(pattern.replace(/\*/g, '.*'));
					return regex.test(entry);
				});
			});
		}

		// Get detailed information and sort
		const entryDetails: Array<{name: string; isDir: boolean; type: string}> =
			[];

		for (const entry of entries) {
			try {
				const entryPath = join(resolvedPath, entry);
				const stats = await stat(entryPath);
				entryDetails.push({
					name: entry,
					isDir: stats.isDirectory(),
					type: stats.isDirectory() ? '[DIR]' : entry,
				});
			} catch {
				entryDetails.push({
					name: entry,
					isDir: false,
					type: entry,
				});
			}
		}

		// Sort: directories first, then alphabetically
		entryDetails.sort((a, b) => {
			if (a.isDir && !b.isDir) return -1;
			if (!a.isDir && b.isDir) return 1;
			return a.name.localeCompare(b.name);
		});

		const output = `Directory listing for ${dirPath}:\n${entryDetails
			.map(e => e.type)
			.join('\n')}`;

		return {
			success: true,
			output,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			output: '',
			error: `Failed to list directory ${dirPath}: ${errorMessage}`,
		};
	}
}

/**
 * 2. read_file (ReadFile)
 * Reads and returns the content of a specified file
 */
export async function readFile(args: {
	path: string;
	offset?: number;
	limit?: number;
}): Promise<ToolResult> {
	const {path: filePath, offset, limit} = args;

	try {
		const resolvedPath = resolve(filePath);
		await access(resolvedPath, constants.F_OK | constants.R_OK);

		const stats = await stat(resolvedPath);

		// Check if it's a binary file by extension
		const imageExtensions = [
			'.png',
			'.jpg',
			'.jpeg',
			'.gif',
			'.webp',
			'.svg',
			'.bmp',
		];
		const pdfExtensions = ['.pdf'];
		const extension = filePath
			.toLowerCase()
			.substring(filePath.lastIndexOf('.'));

		if (imageExtensions.includes(extension)) {
			// Handle image files - return base64 encoded
			const content = await fsReadFile(resolvedPath);
			const mimeType = `image/${
				extension.slice(1) === 'jpg' ? 'jpeg' : extension.slice(1)
			}`;
			return {
				success: true,
				output: JSON.stringify({
					inlineData: {
						mimeType,
						data: content.toString('base64'),
					},
				}),
			};
		}

		if (pdfExtensions.includes(extension)) {
			// Handle PDF files - return base64 encoded
			const content = await fsReadFile(resolvedPath);
			return {
				success: true,
				output: JSON.stringify({
					inlineData: {
						mimeType: 'application/pdf',
						data: content.toString('base64'),
					},
				}),
			};
		}

		// Handle text files
		const content = await fsReadFile(resolvedPath, 'utf-8');
		const lines = content.split('\n');

		let resultContent = content;
		let truncationMessage = '';

		if (offset !== undefined && limit !== undefined) {
			const selectedLines = lines.slice(offset, offset + limit);
			resultContent = selectedLines.join('\n');
			truncationMessage = `[File content truncated: showing lines ${
				offset + 1
			}-${Math.min(offset + limit, lines.length)} of ${
				lines.length
			} total lines]\n`;
		} else if (lines.length > 2000) {
			const selectedLines = lines.slice(0, 2000);
			resultContent = selectedLines.join('\n');
			truncationMessage = `[File content truncated: showing first 2000 lines of ${lines.length} total lines]\n`;
		}

		return {
			success: true,
			output: truncationMessage + resultContent,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';

		if (errorMessage.includes('ENOENT')) {
			return {
				success: false,
				output: '',
				error: `File not found: ${filePath}`,
			};
		}

		return {
			success: false,
			output: '',
			error: `Failed to read file ${filePath}: ${errorMessage}`,
		};
	}
}

/**
 * 3. write_file (WriteFile)
 * Writes content to a specified file
 */
export async function writeFile(args: {
	file_path: string;
	content: string;
}): Promise<ToolResult> {
	const {file_path: filePath, content} = args;
	useProgressStore.getState().setProgress(`Writing to file: ${filePath}`);

	try {
		const resolvedPath = resolve(filePath);
		const parentDir = dirname(resolvedPath);

		// Create parent directories if they don't exist
		await mkdir(parentDir, {recursive: true});

		// Check if file exists to determine message
		let fileExists = false;
		try {
			await access(resolvedPath, constants.F_OK);
			fileExists = true;
		} catch {
			// File doesn't exist
		}

		// Write the file
		await fsWriteFile(resolvedPath, content, 'utf-8');

		const message = fileExists
			? `Successfully overwrote file: ${filePath}`
			: `Successfully created and wrote to new file: ${filePath}`;

		return {
			success: true,
			output: message,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			output: '',
			error: `Failed to write file ${filePath}: ${errorMessage}`,
		};
	}
}

/**
 * 4. glob (FindFiles)
 * Finds files matching specific glob patterns
 */
export async function glob(args: {
	pattern: string;
	path?: string;
	case_sensitive?: boolean;
	respect_git_ignore?: boolean;
}): Promise<ToolResult> {
	const {
		pattern,
		path: searchPath = process.cwd(),
		case_sensitive = false,
		respect_git_ignore = true,
	} = args;

	try {
		const resolvedPath = resolve(searchPath);
		// const fullPattern = join(resolvedPath, pattern);

		const options: any = {
			cwd: resolvedPath,
			absolute: true,
			nocase: !case_sensitive,
			ignore: respect_git_ignore
				? ['node_modules/**', '.git/**', '*.log', '*.tmp']
				: [],
		};

		const matches = await globPattern(pattern, options);

		if (matches.length === 0) {
			return {
				success: true,
				output: `No files found matching "${pattern}" within ${searchPath}`,
			};
		}

		// Sort by modification time (newest first)
		const filesWithStats = await Promise.all(
			matches.map(async file => {
				try {
					const stats = await stat(file);
					return {file, mtime: stats.mtime};
				} catch {
					return {file, mtime: new Date(0)};
				}
			}),
		);

		filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
		const sortedFiles = filesWithStats.map(f => f.file);

		const output = `Found ${
			matches.length
		} file(s) matching "${pattern}" within ${searchPath}, sorted by modification time (newest first):\n${sortedFiles.join(
			'\n',
		)}`;

		return {
			success: true,
			output,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			output: '',
			error: `Failed to find files with pattern ${pattern}: ${errorMessage}`,
		};
	}
}

/**
 * 5. search_file_content (SearchText)
 * Searches for a regex pattern within file contents
 */
export async function searchFileContent(args: {
	pattern: string;
	path?: string;
	include?: string;
}): Promise<ToolResult> {
	const {pattern, path: searchPath = process.cwd(), include} = args;

	try {
		const resolvedPath = resolve(searchPath);

		// Try git grep first if available
		let command = '';
		let isGitRepo = false;

		try {
			execSync('git rev-parse --git-dir', {cwd: resolvedPath, stdio: 'ignore'});
			isGitRepo = true;
		} catch {
			// Not a git repo
		}

		if (isGitRepo) {
			command = `git grep -n "${pattern}"`;
			if (include) {
				command += ` -- "${include}"`;
			}
		} else {
			// Fallback to regular grep or find
			if (include) {
				command = `find "${resolvedPath}" -name "${include}" -type f -exec grep -Hn "${pattern}" {} +`;
			} else {
				command = `grep -rn "${pattern}" "${resolvedPath}"`;
			}
		}

		try {
			const {stdout} = await execAsync(command, {cwd: resolvedPath});

			if (!stdout.trim()) {
				return {
					success: true,
					output: `No matches found for pattern "${pattern}" in path "${searchPath}"${
						include ? ` (filter: "${include}")` : ''
					}`,
				};
			}

			// Format the output
			const lines = stdout.trim().split('\n');
			const groupedResults: {[file: string]: string[]} = {};

			for (const line of lines) {
				const match = line.match(/^([^:]+):(\d+):(.*)/);
				if (match) {
					const [, file, lineNum, content] = match;
					if (file && lineNum && content) {
						const relativePath = relative(resolvedPath, file);

						if (!groupedResults[relativePath]) {
							groupedResults[relativePath] = [];
						}
						groupedResults[relativePath].push(`L${lineNum}: ${content}`);
					}
				}
			}

			let output = `Found ${
				lines.length
			} matches for pattern "${pattern}" in path "${searchPath}"${
				include ? ` (filter: "${include}")` : ''
			}:\n---\n`;

			for (const [file, matches] of Object.entries(groupedResults)) {
				output += `File: ${file}\n${matches.join('\n')}\n---\n`;
			}

			return {
				success: true,
				output: output.trim(),
			};
		} catch (error) {
			return {
				success: true,
				output: `No matches found for pattern "${pattern}" in path "${searchPath}"${
					include ? ` (filter: "${include}")` : ''
				}`,
			};
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			output: '',
			error: `Failed to search for pattern ${pattern}: ${errorMessage}`,
		};
	}
}

/**
 * 6. replace (Edit)
 * Replaces text within a file with enhanced reliability
 */
export async function replace(args: {
	file_path: string;
	old_string: string;
	new_string: string;
	expected_replacements?: number;
}): Promise<ToolResult> {
	const {
		file_path: filePath,
		old_string: oldString,
		new_string: newString,
		expected_replacements = 1,
	} = args;

	try {
		const resolvedPath = resolve(filePath);

		// If old_string is empty, create new file
		if (oldString === '') {
			try {
				await access(resolvedPath, constants.F_OK);
				return {
					success: false,
					output: '',
					error: `Cannot create file ${filePath}: file already exists`,
				};
			} catch {
				// File doesn't exist, create it
				await mkdir(dirname(resolvedPath), {recursive: true});
				await fsWriteFile(resolvedPath, newString, 'utf-8');
				return {
					success: true,
					output: `Created new file: ${filePath} with provided content.`,
				};
			}
		}

		// Read existing file
		const content = await fsReadFile(resolvedPath, 'utf-8');

		// Count occurrences
		const occurrences = (
			content.match(new RegExp(escapeRegExp(oldString), 'g')) || []
		).length;

		if (occurrences === 0) {
			return {
				success: false,
				output: '',
				error: `Failed to edit, 0 occurrences found of the specified old_string in ${filePath}`,
			};
		}

		if (occurrences !== expected_replacements) {
			return {
				success: false,
				output: '',
				error: `Failed to edit, expected ${expected_replacements} occurrences but found ${occurrences} in ${filePath}`,
			};
		}

		// Perform replacement
		const newContent = content.replace(
			new RegExp(escapeRegExp(oldString), 'g'),
			newString,
		);

		// Write back to file
		await fsWriteFile(resolvedPath, newContent, 'utf-8');

		return {
			success: true,
			output: `Successfully modified file: ${filePath} (${expected_replacements} replacements).`,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';

		if (errorMessage.includes('ENOENT')) {
			return {
				success: false,
				output: '',
				error: `File not found: ${filePath}`,
			};
		}

		return {
			success: false,
			output: '',
			error: `Failed to edit file ${filePath}: ${errorMessage}`,
		};
	}
}

/**
 * Utility function to escape regex special characters
 */
function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
