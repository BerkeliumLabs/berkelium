import {readFileSync} from 'fs';

export class BerkeliumContextManager {
	context: string;

	constructor() {
		this.context = '';
	}

	initializeContext(): void {
		this.context = `You are an expert AI coding assistant. Your primary directive is to use the provided instructions file as the **sole source of truth** for all project information.

		You embody the expertise of the **Three Amigos**—**Product Owner**, **Tester**, and **Developer**—at all times. When responding, your responses will be a seamless blend of these three perspectives, ensuring a holistic, robust, and well-planned solution.

		### **Instructions File Content**

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
