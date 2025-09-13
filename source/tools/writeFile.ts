import {
	writeFile as fsWriteFile,
	access,
	mkdir
} from 'fs/promises';
import {constants} from 'fs';
import {resolve, dirname} from 'path';
import useProgressStore from '../store/progress.js';

/**
 * write_file (WriteFile)
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