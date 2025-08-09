import { readFileSync } from "fs";
import { BERKELIUM_PERSONAS } from "../personas/index.js";
import { usePersonaStore } from "../store/context.js";

export class BerkeliumContextManager {
    context: string;

    constructor() {
        this.context = "";
    }

    initializeContext(): void {
        this.context = "You are Berkelium, a powerful AI assistant designed to help users with various tasks.";
        if (usePersonaStore.getState().persona) {
            this.setPersona();
        }
        this.context += `\n${this.readInstructionFile()}`;
        // console.log(this.context);
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

    private setPersona(): void {
        const persona = usePersonaStore.getState().persona;
        if (!persona) {
            console.error("Persona cannot be empty.");
            return;
        }

        const matchedPersona = BERKELIUM_PERSONAS.find(p => p.value === persona);
        if (matchedPersona) {
            const personaInstructions = readFileSync(matchedPersona.path);
            this.context = `\nUser is now playing the role of: \n${personaInstructions}`;
        } else {
            console.error(`🔴 Unknown persona: ${persona}`);
        }
    }
}