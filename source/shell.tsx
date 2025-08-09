import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import React, {useState} from 'react';
import {BerkeliumCLI} from './berkelium.js';
import {ConfigManager} from './utils/config.js';
import Link from 'ink-link';

export const AppShell = () => {
	const configManager = ConfigManager.getInstance();

	const [isApiKeyConfigured, setIsApiKeyConfigured] = useState(
		configManager.isApiKeyConfigured(),
	);

	const handleConfiguration = (value: string) => {
		configManager.checkAndConfigureApiKey(value);
		setIsApiKeyConfigured(configManager.isApiKeyConfigured());
	};

	return (
		<Box flexDirection="column">
			{isApiKeyConfigured ? (
				<BerkeliumCLI />
			) : (
				<Box flexDirection="column" marginTop={1}>
					<Link url="https://aistudio.google.com/apikey">
						Please configure your API key first.{' '}
						<Text color="#FF6F00">Get your API key.</Text>
					</Link>
					<Box
						borderStyle="round"
						borderColor="#FFBF00"
						paddingX={1}
						paddingY={0}
					>
						<TextInput
							value={''}
							onChange={handleConfiguration}
							placeholder="Enter your API key..."
						/>
					</Box>
				</Box>
			)}
		</Box>
	);
};
