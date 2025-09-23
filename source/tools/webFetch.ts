import chalk from 'chalk';
import useProgressStore from '../store/progress.js';

/**
 * web_fetch (Web Content Fetcher)
 * Fetches and processes content from web URLs embedded in a prompt
 */
export async function webFetch(args: {prompt: string}): Promise<ToolResult> {
	const {prompt} = args;
	useProgressStore
		.getState()
		.setProgress(`Fetching content from URLs in prompt`);
	console.log(`${chalk.hex('#e05d38').bold('●')} Fetching content from URLs in prompt`);

	try {
		// Extract URLs from the prompt (up to 20)
		const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
		const urls = prompt.match(urlRegex) || [];

		if (urls.length === 0) {
			console.log(`└─ ${chalk.red('No URLs found in the prompt')}\n`);
			return {
				success: false,
				output: '',
				error:
					'No URLs found in the prompt. Please include at least one URL starting with http:// or https://',
			};
		}

		if (urls.length > 20) {
			console.log(`└─ ${chalk.red('Too many URLs detected')}\n`);
			return {
				success: false,
				output: '',
				error: 'Too many URLs detected. Maximum of 20 URLs is allowed.',
			};
		}

		// Remove duplicates
		const uniqueUrls = [...new Set(urls)];
		useProgressStore
			.getState()
			.setProgress(`Found ${uniqueUrls.length} unique URLs`);
		console.log(`├─ ${chalk.yellow(`Found ${uniqueUrls.length} unique URLs`)}`);

		// Note: User confirmation would typically be handled by the CLI interface
		// For now, we proceed with fetching as the tool is designed to be autonomous

		// Fetch content from each URL
		useProgressStore
			.getState()
			.setProgress(`Fetching content from ${uniqueUrls.length} URLs`);
		console.log(`├─ ${chalk.yellow(`Fetching content from ${uniqueUrls.length} URLs`)}`);

		const fetchPromises = uniqueUrls.map(async url => {
			try {
				// Create AbortController for timeout
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

				// Use native fetch for web content
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'User-Agent': 'Berkelium-WebFetch/1.0 (Web Content Analysis Tool)',
						Accept:
							'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.1',
						'Accept-Language': 'en-US,en;q=0.9',
						'Accept-Encoding': 'gzip, deflate',
						Connection: 'keep-alive',
					},
					redirect: 'follow',
					signal: controller.signal,
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					console.log(`└─ ${chalk.red(`Failed to fetch: HTTP ${response.status} ${response.statusText}`)}\n`);
					return {
						url,
						success: false,
						content: `Failed to fetch: HTTP ${response.status} ${response.statusText}`,
					};
				}

				const contentType = response.headers.get('content-type') || '';

				// Only process text-based content
				if (
					!contentType.includes('text/') &&
					!contentType.includes('application/json') &&
					!contentType.includes('application/xml') &&
					!contentType.includes('application/xhtml')
				) {
					console.log(`└─ ${chalk.red(`Unsupported content type: ${contentType}`)}\n`);
					return {
						url,
						success: false,
						content: `Unsupported content type: ${contentType}. Only text-based content is supported.`,
					};
				}

				const content = await response.text();

				// Enhanced HTML cleaning for better readability
				let cleanContent = content;
				if (contentType.includes('text/html')) {
					// Remove script, style, and other non-content tags
					cleanContent = cleanContent.replace(
						/<script[^>]*>[\s\S]*?<\/script>/gi,
						'',
					);
					cleanContent = cleanContent.replace(
						/<style[^>]*>[\s\S]*?<\/style>/gi,
						'',
					);
					cleanContent = cleanContent.replace(
						/<noscript[^>]*>[\s\S]*?<\/noscript>/gi,
						'',
					);
					cleanContent = cleanContent.replace(/<!--[\s\S]*?-->/gi, '');

					// Convert common structural elements to readable format
					cleanContent = cleanContent.replace(
						/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi,
						'\n\n## $2\n\n',
					);
					cleanContent = cleanContent.replace(/<p[^>]*>/gi, '\n\n');
					cleanContent = cleanContent.replace(/<\/p>/gi, '');
					cleanContent = cleanContent.replace(/<br[^>]*>/gi, '\n');
					cleanContent = cleanContent.replace(/<li[^>]*>/gi, '• ');
					cleanContent = cleanContent.replace(/<\/li>/gi, '\n');

					// Remove remaining HTML tags
					cleanContent = cleanContent.replace(/<[^>]*>/g, ' ');

					// Clean up whitespace and decode HTML entities
					cleanContent = cleanContent
						.replace(/&nbsp;/g, ' ')
						.replace(/&amp;/g, '&')
						.replace(/&lt;/g, '<')
						.replace(/&gt;/g, '>')
						.replace(/&quot;/g, '"')
						.replace(/&#39;/g, "'")
						.replace(/\s+/g, ' ')
						.replace(/\n\s+/g, '\n')
						.trim();
				}

				console.log(`└─ ${chalk.green('Done!')}\n`);
				return {
					url,
					success: true,
					content: cleanContent,
					contentType,
				};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.log(`└─ ${chalk.red(`Failed to fetch: ${errorMessage}`)}\n`);
				return {
					url,
					success: false,
					content: `Failed to fetch: ${errorMessage}`,
				};
			}
		});

		// Wait for all fetches to complete
		useProgressStore
			.getState()
			.setProgress(`Waiting for all fetches to complete`);
		console.log(`├─ ${chalk.yellow(`Waiting for all fetches to complete`)}`);
		const results = await Promise.all(fetchPromises);

		// Format the response
		const successfulFetches = results.filter(r => r.success);
		const failedFetches = results.filter(r => !r.success);

		if (successfulFetches.length === 0) {
			console.log(`└─ ${chalk.red('No successful fetches')}\n`);
			return {
				success: false,
				output: '',
				error: `Failed to fetch content from any of the ${
					uniqueUrls.length
				} URL(s). Errors:\n${failedFetches
					.map(f => `- ${f.url}: ${f.content}`)
					.join('\n')}`,
			};
		}

		// Build the output
		let output = `Successfully fetched content from ${successfulFetches.length} of ${uniqueUrls.length} URL(s):\n\n`;

		// Add the original prompt context
		output += `Original Request: ${prompt}\n\n`;

		console.log(`├─ ${chalk.yellow(`Add content from each successful fetch`)}`);
		// Add content from each successful fetch
		for (const result of successfulFetches) {
			output += `--- Content from ${result.url} ---\n`;
			if (result.contentType) {
				output += `Content-Type: ${result.contentType}\n`;
			}
			output += `${result.content}\n\n`;
		}

		console.log(`├─ ${chalk.yellow(`Add any fetch failures as warnings`)}`);
		// Add any fetch failures as warnings
		if (failedFetches.length > 0) {
			output += `--- Fetch Warnings ---\n`;
			for (const failed of failedFetches) {
				output += `Could not fetch ${failed.url}: ${failed.content}\n`;
			}
		}

		output += '--- End of fetched content ---';

		console.log(`└─ ${chalk.green('Done!')}\n`);
		return {
			success: true,
			output,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		useProgressStore.getState().setProgress(errorMessage);
		console.log(`└─ ${chalk.red(`Web fetch failed: ${errorMessage}`)}\n`);
		return {
			success: false,
			output: '',
			error: `Web fetch failed: ${errorMessage}`,
		};
	}
}
