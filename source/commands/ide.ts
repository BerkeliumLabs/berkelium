import { INSTRCTION_FILE_PROMPT } from "./instructions.const.js";

export const ideCommand: BerkeliumCommand = {
    name: 'ide',
    description: 'Generate instruction file for the desired IDE',
    prompt: INSTRCTION_FILE_PROMPT
}