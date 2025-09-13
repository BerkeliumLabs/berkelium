import {execSync, exec} from 'child_process';
import {promisify} from 'util';
import {resolve, relative} from 'path';
import useProgressStore from '../store/progress.js';

const execAsync = promisify(exec);

/**
 * search_file_content (SearchText)
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
		useProgressStore.getState().setProgress(`Searching for pattern "${pattern}" in ${resolvedPath}`);

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
			useProgressStore.getState().setProgress(`Found ${stdout.trim().split('\n').length} matches`);

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
			useProgressStore.getState().setProgress(errorMessage);
		return {
			success: false,
			output: '',
			error: `Failed to search for pattern ${pattern}: ${errorMessage}`,
		};
	}
}