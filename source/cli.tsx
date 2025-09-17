import React from 'react';
import {render} from 'ink';
import chalk from 'chalk';
import {AppShell} from './shell.js';

// Welcome message
const [{default: figlet}, {default: gradient}] = await Promise.all([
	import('figlet'),
	import('gradient-string'),
]);

const coolGradient = gradient(['#e6a08f', '#e05d38']);
const welcomeArt = coolGradient(
	figlet.textSync('Berkelium CLI', {
		font: 'ANSI Shadow',
		horizontalLayout: 'default',
		verticalLayout: 'default',
		whitespaceBreak: true,
	}),
);

const instructions = chalk.blueBright(
	`Version ${process.env['npm_package_version']}
Type your questions or commands. Enter "exit", "quit" or press Ctrl+C twice to shutdown the agent.\n`,
);

console.log(welcomeArt);
console.log(instructions);

render(<AppShell />);
