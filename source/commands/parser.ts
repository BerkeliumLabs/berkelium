export function parseCommand(input: string): ParsedCommand {
	if (!input.startsWith('/')) {
		throw new Error('Invalid command format. Commands must start with "/"');
	}

	const trimmedInput = input.slice(1).trim();
	const spaceIndex = trimmedInput.indexOf(' ');

	if (spaceIndex === -1) {
		return {
			command: trimmedInput,
			arguments: null,
		};
	}

	const command = trimmedInput.slice(0, spaceIndex);
	const args = trimmedInput.slice(spaceIndex + 1).trim();

	return {
		command,
		arguments: args || null,
	};
}

export function interpolateArguments(template: string, args: string | null): string {
	if (args === null) {
		return template.replace(/\$ARGUMENTS/g, '');
	}

	return template.replace(/\$ARGUMENTS/g, args);
}