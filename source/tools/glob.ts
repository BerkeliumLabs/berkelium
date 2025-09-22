import {stat} from 'fs/promises';
import {resolve} from 'path';
import {glob as globPattern} from 'glob';
import useProgressStore from '../store/progress.js';
import chalk from 'chalk';

/**
 * glob (FindFiles)
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
		useProgressStore
			.getState()
			.setProgress(
				`Searching for files with pattern "${pattern}" in ${resolvedPath}`,
			);
		console.log(
			`${chalk
				.hex('#e05d38')
				.bold(
					'●',
				)} Searching for files with pattern "${pattern}" in ${resolvedPath}`,
		);
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
		useProgressStore
			.getState()
			.setProgress(
				`Found ${matches.length} files, sorting by modification time`,
			);
		console.log(`├─ ${chalk.yellow(`Found ${matches.length} files, sorting by modification time`)}`);
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

		console.log(`└─ ${chalk.green('Done!')}\n`);
		return {
			success: true,
			output,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		useProgressStore.getState().setProgress(errorMessage);

		console.log(`└─ ${chalk.red(`Failed to find files with pattern ${pattern}: ${errorMessage}`)}\n`);
		return {
			success: false,
			output: '',
			error: `Failed to find files with pattern ${pattern}: ${errorMessage}`,
		};
	}
}
