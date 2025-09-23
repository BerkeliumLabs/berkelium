import {z} from 'zod';
import useProgressStore from '../store/progress.js';
import chalk from 'chalk';

export const webSearchSchema = z.object({
	query: z.string().describe('The search query.'),
});

type WebSearchParams = z.infer<typeof webSearchSchema>;

export const webSearch = async ({query}: WebSearchParams) => {
	useProgressStore.getState().setProgress(`Searching the web for "${query}"`);
	console.log(`${chalk.hex('#e05d38').bold('●')} Searching the web for "${query}"`);
	try {
		const url = new URL('https://api.duckduckgo.com/');
		url.searchParams.append('q', query);
		url.searchParams.append('format', 'json');
		url.searchParams.append('no_html', '1');
		url.searchParams.append('skip_disambig', '1');

		const response = await fetch(url.toString(), {
			headers: {
				'User-Agent': 'Berkelium-WebSearch/1.0',
			},
		});

		if (!response.ok) {
			console.log(`└─ ${chalk.red(`DuckDuckGo API error: ${response.status} ${response.statusText}`)}\n`);
			throw new Error(
				`DuckDuckGo API error: ${response.status} ${response.statusText}`,
			);
		}

		const data = (await response.json()) as any;
		useProgressStore.getState().setProgress(`Processing search results`);
		console.log(`├─ ${chalk.yellow(`Processing search results`)}`);

		const results: any[] = [];

		if (data.AbstractText) {
			results.push({
				title: data.Heading || 'DuckDuckGo Instant Answer',
				url: data.AbstractURL || 'https://duckduckgo.com',
				snippet: data.AbstractText,
			});
		}

		if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
			for (const topic of data.RelatedTopics) {
				if (topic.Text && topic.FirstURL) {
					results.push({
						title: topic.Text.split(' - ')[0] || 'Related Topic',
						url: topic.FirstURL,
						snippet: topic.Text,
					});
				}
			}
		}

		if (results.length === 0) {
			console.log(`└─ ${chalk.red(`No results found for "${query}"`)}\n`);
			return `No results found for "${query}". Try searching on https://duckduckgo.com/?q=${encodeURIComponent(
				query,
			)}`;
		}

		console.log(`└─ ${chalk.green('Done!')}\n`);
		return JSON.stringify(results, null, 2);
	} catch (error) {
		if (error instanceof Error) {
			useProgressStore.getState().setProgress(error.message);
			return `An error occurred while searching: ${error.message}`;
		}
		useProgressStore
			.getState()
			.setProgress('An unknown error occurred while searching.');
		console.log(`└─ ${chalk.red('An unknown error occurred while searching.')}\n`);
		return 'An unknown error occurred while searching.';
	}
};
