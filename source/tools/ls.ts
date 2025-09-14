import {access, readdir, stat} from 'fs/promises';
import {constants} from 'fs';
import {resolve, join} from 'path';
import useProgressStore from '../store/progress.js';

/**
 * list_directory (ReadFolder)
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
		useProgressStore
			.getState()
			.setProgress(`Listing directory: ${resolvedPath}`);
		await access(resolvedPath, constants.F_OK | constants.R_OK);

		let entries = await readdir(resolvedPath);

		// Apply ignore patterns
		if (ignore.length > 0) {
			useProgressStore.getState().setProgress(`Applying ignore patterns`);
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
			useProgressStore.getState().setProgress(`Applying gitignore`);
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

		useProgressStore.getState().setProgress(`Getting entry details`);
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
		useProgressStore.getState().setProgress(`Sorting entries`);
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
		useProgressStore.getState().setProgress(errorMessage);
		return {
			success: false,
			output: '',
			error: `Failed to list directory ${dirPath}: ${errorMessage}`,
		};
	}
}
