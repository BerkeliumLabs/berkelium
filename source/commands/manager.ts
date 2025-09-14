import {parseCommand, interpolateArguments} from './parser.js';
import initCommand from './init.js';

export class CommandManager {
	private commands: Map<string, BerkeliumCommand> = new Map();

	constructor() {
		this.loadCommands();
	}

	private loadCommands(): void {
		// Register built-in commands
		const builtInCommands: BerkeliumCommand[] = [
			initCommand,
		];

		for (const command of builtInCommands) {
			if (command && command.name && command.prompt) {
				this.commands.set(command.name, command);
			}
		}
	}

	public reloadCommands(): void {
		this.commands.clear();
		this.loadCommands();
	}

	public getCommand(name: string): BerkeliumCommand | undefined {
		return this.commands.get(name);
	}

	public getAllCommands(): BerkeliumCommand[] {
		return Array.from(this.commands.values());
	}

	public getCommandNames(): string[] {
		return Array.from(this.commands.keys());
	}

	public async executeCommand(input: string): Promise<CommandExecutionResult> {
		try {
			const parsed: ParsedCommand = parseCommand(input);
			const command = this.getCommand(parsed.command);

			if (!command) {
				return {
					success: false,
					error: `Command "${parsed.command}" not found. Available commands: ${this.getCommandNames().join(', ')}`,
				};
			}

			const interpolatedPrompt = interpolateArguments(command.prompt, parsed.arguments);

			return {
				success: true,
				result: interpolatedPrompt,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error occurred',
			};
		}
	}
}