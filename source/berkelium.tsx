import React, {useState, useEffect} from 'react';
import {render, Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import {readdirSync} from 'fs';

export const BerkeliumCLI = () => {
	const [inputValue, setInputValue] = useState('');
	const [mode, setMode] = useState('input');
	const [filteredItems, setFilteredItems] = useState<
		{label: string; value: string}[]
	>([]);
	const [isSelecting, setIsSelecting] = useState(false);
  const [inputKey, setInputKey] = useState(0);

	// Predefined list for @
	const roleItems = [
		{label: 'BA', value: 'BA'},
		{label: 'PM', value: 'PM'},
		{label: 'Dev', value: 'Dev'},
		{label: 'Tester', value: 'Tester'},
		{label: 'DevOps', value: 'DevOps'},
	];

	useEffect(() => {
		// Handle mode changes and filtering
		if (inputValue.endsWith('#')) {
			const searchInput = inputValue.split('#').at(-1) ?? '';
			setIsSelecting(true);
			setMode('files');
			handleFilter(searchInput);
		} else if (inputValue.endsWith('@')) {
			setIsSelecting(true);
			setMode('roles');
			const searchInput = inputValue.split('@').at(-1) ?? '';
			handleFilter(searchInput);
		} else if (mode === 'files') {
			const searchInput = inputValue.split('#').at(-1) ?? '';
			handleFilter(searchInput);
		} else if (mode === 'roles') {
			const searchInput = inputValue.split('@').at(-1) ?? '';
			handleFilter(searchInput);
		} else {
			setMode('input');
		}
	}, [inputValue, mode, isSelecting]);

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
		} else if (mode === 'roles') {
			const search = searchInput.toLowerCase();
			setFilteredItems(
				roleItems.filter(item => item.label.toLowerCase().includes(search)),
			);
		}
	};

	const handleInputChange = (value: string) => {
		if (isSelecting) {
			setIsSelecting(false);
			return;
		}
		console.log(`🔵 ${value}`);
		setInputValue(''); // Clear input after submission
	};

	const handleSelectChange = (item: IHandleSelectChangeItem): void => {
		let prefix = '';
		let fullInput = '';
		if (mode === 'files') {
			fullInput = inputValue.split('#').slice(0, -1).join('#') ?? '';
			prefix = '#';
		} else if (mode === 'roles') {
			fullInput = inputValue.split('@').slice(0, -1).join('@') ?? '';
			prefix = '@';
		}
		// Set the input value to the prefix plus the selected item's value
		setMode('input');
    setIsSelecting(false);
		setInputValue(fullInput + prefix + item?.value);
    setInputKey(prevKey => prevKey + 1);
	};

	return (
		<Box flexDirection="column">
			<Box borderStyle="round" borderColor="#FFBF00" paddingX={1} paddingY={0}>
				<Text color="#FFBF00">{'>'} </Text>
				<TextInput
					value={inputValue}
					onChange={setInputValue}
					showCursor={mode === 'input'}
					key={inputKey}
					placeholder='Enter your prompt'
					onSubmit={() => {
						handleInputChange(inputValue);
					}}
				/>
			</Box>

			{mode !== 'input' && (
				<Box marginTop={1}>
					<SelectInput items={filteredItems} onSelect={handleSelectChange} />
				</Box>
			)}
		</Box>
	);
};

// Render the UI
render(<BerkeliumCLI />);
