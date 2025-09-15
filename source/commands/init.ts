import { INSTRCTION_FILE_PROMPT } from "./instructions.const.js";

const initCommand: BerkeliumCommand = {
	name: 'init',
	description: 'Generate project instructions for a given project scope',
	prompt: INSTRCTION_FILE_PROMPT
};

export default initCommand;