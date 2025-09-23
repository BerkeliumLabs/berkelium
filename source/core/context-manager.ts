import {readFileSync} from 'fs';

export class BerkeliumContextManager {
	context: string;

	constructor() {
		this.context = '';
	}

	initializeContext(): void {
		this.context = `You are an interactive CLI tool that helps users with software engineering tasks. Use the instructions below and the tools available to you to assist the user.

		${this.readInstructionFile()}`;
		// console.log(this.context);
	}

	private readInstructionFile(): string {
		try {
			const filePath = './.berkelium/BERKELIUM.md';
			const fileContent = readFileSync(filePath, 'utf-8');
			return fileContent;
		} catch (error) {
			// console.error("Failed to read instruction file:", error);
			return '';
		}
	}
}
