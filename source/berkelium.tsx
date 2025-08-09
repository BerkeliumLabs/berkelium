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
		if (inputValue.startsWith('#')) {
			setMode('files');
			const search = inputValue.substring(1).toLowerCase();
			const files = readdirSync('.').map(file => ({
				label: file,
				value: file,
			}));
			setFilteredItems(
				files.filter(item => item.label.toLowerCase().includes(search)),
			);
		} else if (inputValue.startsWith('@')) {
			setMode('roles');
			const search = inputValue.substring(1).toLowerCase();
			setFilteredItems(
				roleItems.filter(item => item.label.toLowerCase().includes(search)),
			);
		} else {
			setMode('input');
		}
	}, [inputValue]);

  const handleInputChange = (value: string) => {
    console.log(`🔵 ${value}`);
    setInputValue(''); // Clear input after submission
  };

	return (
		<Box flexDirection="column">
			<Box borderStyle="round" borderColor="#FFBF00" paddingX={1} paddingY={0}>
				<Text color="#FFBF00">{'>'} </Text>
				<TextInput
					value={inputValue}
					onChange={setInputValue}
					showCursor={mode === 'input'}
					onSubmit={() => {
						handleInputChange(inputValue);
					}}
				/>
			</Box>

			{mode !== 'input' && (
				<Box marginTop={1}>
					<SelectInput
						items={filteredItems}
						onSelect={item => {
							// Handle selection
							setInputValue(inputValue + item.value);
							setMode('input');
						}}
					/>
				</Box>
			)}
		</Box>
	);
};

// Render the UI
render(<BerkeliumCLI />);
