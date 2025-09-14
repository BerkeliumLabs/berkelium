export interface BerkeliumCommand {
	name: string;
	description: string;
	prompt: string;
}

export interface ParsedCommand {
	command: string;
	arguments: string | null;
}

export interface CommandExecutionResult {
	success: boolean;
	result?: string;
	error?: string;
}