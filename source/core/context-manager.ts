import { readFileSync } from "fs";

export class BerkeliumContextManager {
    context: string;

    constructor() {
        this.context = "You are Berkelium, a powerful AI assistant designed to help users with various tasks.";
    }

    initializeContext(): void {
        this.context += `\n${this.readInstructionFile()}`;
    }

    private readInstructionFile(): string {
        try {
            const filePath = "./.berkelium/berkelium.md";
            const fileContent = readFileSync(filePath, "utf-8");
            return fileContent;
        } catch (error) {
            // console.error("Failed to read instruction file:", error);
            return "";
        }
    }
}