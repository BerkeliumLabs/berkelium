#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import { BerkeliumCLI } from './berkelium.js';

// Welcome message
const [{default: figlet}, {default: gradient}] = await Promise.all([
	import('figlet'),
	import('gradient-string'),
]);

const coolGradient = gradient(['#FFA800', '#FF6F00']);
const welcomeArt = coolGradient(
	figlet.textSync('Berkelium.dev', {
		font: 'ANSI Shadow',
		horizontalLayout: 'default',
		verticalLayout: 'default',
		whitespaceBreak: true,
	}),
);

console.log(welcomeArt);

render(
	<BerkeliumCLI />,
);
