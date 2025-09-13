import {
	readFile as fsReadFile,
	access,
	stat,
} from 'fs/promises';
import {constants} from 'fs';
import {resolve} from 'path';
import useProgressStore from '../store/progress.js';

/**
 * read_file (ReadFile)
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
		useProgressStore.getState().setProgress(`Reading file: ${resolvedPath}`);
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
			useProgressStore.getState().setProgress(`Reading image file: ${resolvedPath}`);
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
			useProgressStore.getState().setProgress(`Reading PDF file: ${resolvedPath}`);
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
		useProgressStore.getState().setProgress(`Reading text file: ${resolvedPath}`);
		const content = await fsReadFile(resolvedPath, 'utf-8');
		const lines = content.split('\n');

		let resultContent = content;
		let truncationMessage = '';

		if (offset !== undefined && limit !== undefined) {
			useProgressStore.getState().setProgress(`Slicing file content from ${offset} to ${offset + limit}`);
			const selectedLines = lines.slice(offset, offset + limit);
			resultContent = selectedLines.join('\n');
			truncationMessage = `[File content truncated: showing lines ${
				offset + 1
			}-${Math.min(offset + limit, lines.length)} of ${
				lines.length
			} total lines]\n`;
		} else if (lines.length > 2000) {
			useProgressStore.getState().setProgress(`File too long, truncating to 2000 lines`);
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
			useProgressStore.getState().setProgress(`File not found: ${filePath}`);
			return {
				success: false,
				output: '',
				error: `File not found: ${filePath}`,
			};
		}

		useProgressStore.getState().setProgress(errorMessage);

		return {
			success: false,
			output: '',
			error: `Failed to read file ${filePath}: ${errorMessage}`,
		};
	}
}
