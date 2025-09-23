import {writeFile as fsWriteFile, access, mkdir} from 'fs/promises';
import {constants} from 'fs';
import {resolve, dirname} from 'path';
import useProgressStore from '../store/progress.js';
import chalk from 'chalk';

/**
 * write_file (WriteFile)
 * Writes content to a specified file
 */
export async function writeFile(args: {
	file_path: string;
	content: string;
}): Promise<ToolResult> {
	const {file_path: filePath, content} = args;

	try {
		const resolvedPath = resolve(filePath);
		const parentDir = dirname(resolvedPath);

		// Create parent directories if they don't exist
		await mkdir(parentDir, {recursive: true});
		useProgressStore.getState().setProgress(`Creating directory: ${parentDir}`);
		console.log(`${chalk.hex('#e05d38').bold('●')} Creating directory: ${parentDir}`);

		// Check if file exists to determine message
		let fileExists = false;
		try {
			await access(resolvedPath, constants.F_OK);
			fileExists = true;
		} catch {
			// File doesn't exist
			useProgressStore
				.getState()
				.setProgress(`File doesn't exist: ${resolvedPath}`);
			console.log(`├─ ${chalk.yellow(`File doesn't exist: ${resolvedPath}`)}`);
		}

		// Write the file
		await fsWriteFile(resolvedPath, content, 'utf-8');
		useProgressStore.getState().setProgress(`Writing file: ${resolvedPath}`);
		console.log(`├─ ${chalk.yellow(`Writing file: ${resolvedPath}`)}`);


		const message = fileExists
			? `Successfully overwrote file: ${filePath}`
			: `Successfully created and wrote to new file: ${filePath}`;

		console.log(`└─ ${chalk.green('Done!')}\n`);
		return {
			success: true,
			output: message,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		useProgressStore.getState().setProgress(errorMessage);
		console.log(`└─ ${chalk.red(`Failed to write file ${filePath}: ${errorMessage}`)}\n`);
		return {
			success: false,
			output: '',
			error: `Failed to write file ${filePath}: ${errorMessage}`,
		};
	}
}
