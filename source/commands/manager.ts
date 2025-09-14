import {readdirSync} from 'fs';
import {join} from 'path';
import type {BerkeliumCommand, ParsedCommand, CommandExecutionResult} from './types.js';
import {parseCommand, interpolateArguments} from './parser.js';

export class CommandManager {
	private commands: Map<string, BerkeliumCommand> = new Map();
	private commandsDir: string;

	constructor(commandsDir: string = './source/commands') {
		this.commandsDir = commandsDir;
		this.loadCommands();
	}

	private async loadCommands(): Promise<void> {
		try {
			const files = readdirSync(this.commandsDir);
			const commandFiles = files.filter(file =>
				file.endsWith('.js') && !file.includes('types') && !file.includes('parser') && !file.includes('manager')
			);

			for (const file of commandFiles) {
				try {
					const filePath = join(this.commandsDir, file);
					const module = await import(filePath);
					const command: BerkeliumCommand = module.default || module.command;

					if (command && command.name && command.prompt) {
						this.commands.set(command.name, command);
					}
				} catch (error) {
					console.warn(`Failed to load command from ${file}:`, error);
				}
			}
		} catch (error) {
			console.warn('Commands directory not found or accessible:', error);
		}
	}

	public async reloadCommands(): Promise<void> {
		this.commands.clear();
		await this.loadCommands();
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