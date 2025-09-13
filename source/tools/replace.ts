import {
	readFile as fsReadFile,
	writeFile as fsWriteFile,
	access,
	mkdir
} from 'fs/promises';
import {resolve, dirname} from 'path';
import {constants} from 'fs';
import useProgressStore from '../store/progress.js';

/**
 * replace (Edit)
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
		useProgressStore.getState().setProgress(`Replacing text in ${resolvedPath}`);

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
		useProgressStore.getState().setProgress(`Reading file content`);
		const content = await fsReadFile(resolvedPath, 'utf-8');

		// Count occurrences
		useProgressStore.getState().setProgress(`Counting occurrences of the string to be replaced`);
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
				// Perform replacement
		useProgressStore.getState().setProgress(`Performing replacement`);
		const newContent = content.replace(
			new RegExp(escapeRegExp(oldString), 'g'),
			newString,
		);

		// Write back to file
		useProgressStore.getState().setProgress(`Writing changes back to the file`);
		await fsWriteFile(resolvedPath, newContent, 'utf-8');

		return {
			success: true,
			output: `Successfully modified file: ${filePath} (${expected_replacements} replacements).`,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
			useProgressStore.getState().setProgress(errorMessage);

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