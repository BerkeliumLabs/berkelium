import React, {useState, useEffect} from 'react';
import {render, Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import {readdirSync} from 'fs';
import chalk from 'chalk';
import {BerkeliumRouter} from './core/router.js';
import Spinner from 'ink-spinner';
import useProgressStore from './store/progress.js';
import {useUsageMetaDataStore} from './store/usage.js';
import usePermissionStore from './store/permission.js';
import PermissionPrompt from './components/PermissionPrompt.js';
const berkeliumPromptRouter = new BerkeliumRouter();

export const BerkeliumCLI = () => {
	const [inputValue, setInputValue] = useState('');
	const [mode, setMode] = useState('input');
	const [threadId, setThreadId] = useState('');
	const [filteredItems, setFilteredItems] = useState<
		{label: string; value: string}[]
	>([]);
	const [isSelecting, setIsSelecting] = useState(false);
	const [inputKey, setInputKey] = useState(0);
	const [isRunning, setIsRunning] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const {progress, resetProgress, setProgress} = useProgressStore();
	const {input_tokens, output_tokens, total_tokens} = useUsageMetaDataStore();
	const permissionStatus = usePermissionStore(state => state.status);

	useEffect(() => {
		setThreadId(Date.now().toString());
	}, []);

	useEffect(() => {
		// Handle mode changes and filtering
		if (inputValue.endsWith('#')) {
			const searchInput = inputValue.split('#').at(-1) ?? '';
			setIsSelecting(true);
			setMode('files');
			handleFilter(searchInput);
		} else if (inputValue.endsWith('/')) {
			setIsSelecting(true);
			setMode('commands');
			const searchInput = inputValue.split('/').at(-1) ?? '';
			handleFilter(searchInput);
		} else if (mode === 'files' && inputValue.includes('#')) {
			const searchInput = inputValue.split('#').at(-1) ?? '';
			handleFilter(searchInput);
		} else if (mode === 'commands' && inputValue.includes('/')) {
			const searchInput = inputValue.split('/').at(-1) ?? '';
			handleFilter(searchInput);
		} else {
			setMode('input');
			setIsSelecting(false);
		}
	}, [inputValue, mode, isSelecting]);

	useInput((input, key) => {
		if (key.ctrl && (input === 'c' || input === 'C')) {
			console.log(chalk.yellowBright('Press Ctrl+C again to exit.'));
			handleExit();
		}
	});

	const handleFilter = (searchInput: string) => {
		if (mode === 'files') {
			const search = searchInput.toLowerCase();
			const files = readdirSync('.').map(file => ({
				label: file,
				value: file,
			}));
			setFilteredItems(
				files.filter(item => item.label.toLowerCase().includes(search)),
			);
		} else if (mode === 'commands') {
			const search = searchInput.toLowerCase();
			const commands = berkeliumPromptRouter.getAvailableCommands();
			const filtered = commands.filter(item =>
				item.label.toLowerCase().includes(search) ||
				item.value.toLowerCase().includes(search)
			);
			setFilteredItems(filtered);
		}
	};

	const handleInputChange = async (value: string) => {
		if (isSelecting) {
			setIsSelecting(false);
			return;
		}

		console.log(`🔵 ${value}\n`);
		setInputValue(''); // Clear input after submission
		setIsLoading(true);
		try {
			// Handle common commands
			if (value === 'exit' || value === 'quit') {
				handleExit();
			} else if (value.startsWith('/') && value.includes('/clear')) {
				// Clear agent memory for current thread
				berkeliumPromptRouter.clearAgentMemoryForThread(threadId);
				// Reset thread ID to start fresh conversation
				setThreadId(Date.now().toString());
				// Reset progress and usage stores
				resetProgress();
				setIsLoading(false);
				console.log("Agent memory cleared.")
				return; // Exit early to prevent further processing
			} else {
				const response = await berkeliumPromptRouter.routePrompt(
					value,
					threadId,
				);
				setIsLoading(false);
				resetProgress();
				if (false) {
					//
				} else {
					console.log(`🟢 ${response}\n`);
				}
			}
		} catch (error) {
			setIsLoading(false);
			console.error(`🔴 Error occurred while processing prompt: ${error}`);
		}
	};

	const handleSelectChange = (item: IHandleSelectChangeItem): void => {
		if (!item || !item.value) {
			return;
		}

		let newValue = '';
		if (mode === 'files') {
			const parts = inputValue.split('#');
			const baseInput = parts.slice(0, -1).join('#');
			newValue = baseInput + (baseInput ? '#' : '') + item.value;
		} else if (mode === 'commands') {
			// For commands, we want the result to be '/commandname'
			newValue = '/' + item.value;
		}

		// Set the input value to the selected item
		setMode('input');
		setIsSelecting(false);
		setInputValue(newValue);
		setInputKey(prevKey => prevKey + 1);
	};

	const handleExit = () => {
		setIsRunning(false);
		setProgress('Going to sleep...');
		const exitMessage = chalk
			.hex('#FF6F00')
			.bold('\n👋 Goodbye! Thanks for using Berkelium.\n');
		console.log(exitMessage);
		setTimeout(() => {
			process.exit(0);
		}, 1000);
	};

	return (
		<Box flexDirection="column">
			{/* Permission prompt - highest priority */}
			{permissionStatus === 'awaiting_permission' && <PermissionPrompt />}

			{/* Loading indicator */}
			{isLoading && (
				<Text>
					<Text color="green">
						<Spinner type="dots" />
					</Text>
					{` ${progress}`}
				</Text>
			)}

			{/* Tool execution status */}
			{permissionStatus === 'executing' && (
				<Box marginBottom={1}>
					<Text color="blue">
						<Spinner type="dots" />
						{' Executing tool...'}
					</Text>
				</Box>
			)}

			{isRunning &&
				!isLoading &&
				permissionStatus !== 'awaiting_permission' && (
					<Box
						borderStyle="round"
						borderColor="#e05d38"
						paddingX={1}
						paddingY={0}
					>
						<Text color="#e05d38">{'>'} </Text>
						<TextInput
							value={inputValue}
							onChange={setInputValue}
							showCursor={mode === 'input'}
							key={inputKey}
							placeholder="Enter your prompt"
							onSubmit={() => {
								handleInputChange(inputValue);
							}}
						/>
					</Box>
				)}

			{mode !== 'input' && permissionStatus !== 'awaiting_permission' && (
				<Box marginTop={1}>
					<SelectInput items={filteredItems} onSelect={handleSelectChange} />
				</Box>
			)}

			{/* Footer */}
			<Box marginTop={1} marginBottom={1}>
				<Box>
					<Text color="#e05d38">Input Tokens: {input_tokens} | </Text>
					<Text color="#e05d38">Output Tokens: {output_tokens} | </Text>
					<Text color="#e05d38">Total Tokens: {total_tokens}</Text>
				</Box>
			</Box>
		</Box>
	);
};

// Render the UI
render(<BerkeliumCLI />);
