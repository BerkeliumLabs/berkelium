import {relative} from 'path';
import {glob as globPattern} from 'glob';
import {readFile as fsReadFile, stat} from 'fs/promises';
import useProgressStore from '../store/progress.js';

/**
 * read_many_files (Multi-File Reader)
 * Reads content from multiple files specified by paths or glob patterns
 */
export async function readManyFiles(args: {
	paths: string[];
	exclude?: string[];
	include?: string[];
	recursive?: boolean;
	useDefaultExcludes?: boolean;
	respect_git_ignore?: boolean;
}): Promise<ToolResult> {
	const {
		paths,
		exclude = [],
		include = [],
		recursive = true,
		useDefaultExcludes = true,
		respect_git_ignore = true,
	} = args;

	try {
		// Default exclusion patterns
		const defaultExcludes = [
			'node_modules/**',
			'.git/**',
			'*.exe',
			'*.dll',
			'*.so',
			'*.dylib',
			'*.bin',
			'*.log',
			'dist/**',
			'build/**',
			'.next/**',
			'.nuxt/**',
		];

		// Combine all patterns
		const allPaths = [...paths, ...include];
		const allExcludes = useDefaultExcludes
			? [...defaultExcludes, ...exclude]
			: exclude;
		useProgressStore
			.getState()
			.setProgress(`Reading files from ${allPaths.join(', ')}`);

		// Get all matching files
		const allFiles: string[] = [];
		for (const pattern of allPaths) {
			try {
				const globOptions: any = {
					ignore: allExcludes,
					dot: false,
					absolute: true,
				};

				// Add gitignore support if requested
				if (respect_git_ignore) {
					globOptions.gitignore = true;
				}

				const files = await globPattern(pattern, globOptions);
				allFiles.push(...files);
			} catch (error) {
				// Continue with other patterns if one fails
				continue;
			}
		}

		// Remove duplicates
		const uniqueFiles = [...new Set(allFiles)];
		useProgressStore
			.getState()
			.setProgress(`Found ${uniqueFiles.length} files`);

		if (uniqueFiles.length === 0) {
			return {
				success: true,
				output: 'No files found matching the specified patterns.',
			};
		}

		// Process files
		useProgressStore
			.getState()
			.setProgress(`Processing ${uniqueFiles.length} files`);
		const results: string[] = [];
		let processedCount = 0;

		for (const filePath of uniqueFiles) {
			try {
				const fileStats = await stat(filePath);
				if (!fileStats.isFile()) {
					continue;
				}

				// Check if it's a media file (images, PDFs, audio, video)
				const ext = filePath.toLowerCase().split('.').pop() || '';
				const mediaExtensions = [
					'png',
					'jpg',
					'jpeg',
					'gif',
					'webp',
					'svg',
					'bmp',
					'ico',
					'pdf',
					'mp3',
					'wav',
					'flac',
					'aac',
					'm4a',
					'mp4',
					'mov',
					'avi',
					'mkv',
					'webm',
				];

				if (mediaExtensions.includes(ext)) {
					// Handle media files as base64
					const buffer = await fsReadFile(filePath);
					const base64Content = buffer.toString('base64');
					const relativePath = relative(process.cwd(), filePath);

					results.push(`--- ${relativePath} ---`);
					results.push(
						`[Base64 ${ext.toUpperCase()} file: ${buffer.length} bytes]`,
					);
					results.push(base64Content);
				} else {
					// Handle as text file, but check for binary content
					const buffer = await fsReadFile(filePath);

					// Check for null bytes in first 1024 bytes to detect binary files
					const sample = buffer.slice(0, 1024);
					const hasNullBytes = sample.includes(0);

					if (hasNullBytes) {
						// Skip binary files that aren't explicitly supported
						continue;
					}

					// Read as text
					const content = buffer.toString('utf-8');
					const relativePath = relative(process.cwd(), filePath);

					results.push(`--- ${relativePath} ---`);
					results.push(content);
				}

				processedCount++;
			} catch (error) {
				// Skip files that can't be read
				continue;
			}
		}

		results.push('--- End of content ---');

		const output = results.join('\n');

		return {
			success: true,
			output: `Read ${processedCount} files:\n\n${output}`,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		useProgressStore.getState().setProgress(errorMessage);
		return {
			success: false,
			output: '',
			error: `Failed to read files: ${errorMessage}`,
		};
	}
}
