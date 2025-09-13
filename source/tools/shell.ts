import {exec, spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import useProgressStore from '../store/progress.js';

const execAsync = promisify(exec);

/**
 * List of potentially destructive command patterns
 */
const destructivePatterns = [
	/^rm\s+.*-r/i, // Rm -r (recursive delete)
	/^rm\s+.*-f/i, // Rm -f (force delete)
	/^rmdir/i, // Rmdir
	/^del\s+/i, // Windows del command
	/^rd\s+/i, // Windows rd command
	/^format\s+/i, // Format command
	/^fdisk/i, // Fdisk
	/^mkfs/i, // Make filesystem
	/^dd\s+/i, // Dd command
	/^git\s+push\s+.*--force/i, // Git force push
	/^git\s+reset\s+--hard/i, // Git hard reset
	/^npm\s+publish/i, // Npm publish
	/^yarn\s+publish/i, // Yarn publish
	/^docker\s+rmi/i, // Docker remove image
	/^docker\s+rm/i, // Docker remove container
	/^sudo\s+/i, // Sudo commands
	/>\s*\/dev\/null/i, // Redirect to /dev/null
	/chmod\s+.*777/i, // Dangerous chmod
	/chown\s+.*-r/i, // Recursive chown
];

/**
 * Check if a command is potentially destructive
 */
function isDestructiveCommand(command: string): boolean {
	return destructivePatterns.some(pattern => pattern.test(command.trim()));
}

/**
 * Check command restrictions from configuration
 */
function isCommandAllowed(command: string): {
	allowed: boolean;
	reason?: string;
} {
	// For now, return allowed since tool restrictions are not implemented in ConfigManager yet
	// This can be enhanced when tool restriction configuration is added to the Config interface
	return {allowed: true};
}

/**
 * Create environment variables for subprocess execution
 * Sets BERKELIUM_CLI=1 to allow scripts to detect CLI context
 */
function createShellEnvironment(): NodeJS.ProcessEnv {
	return {
		...process.env,
		BERKELIUM_CLI: '1',
	};
}

/**
 * Execute a shell command according to docs/shell.md specification
 */
export async function runShellCommand(args: {
	command: string;
	description?: string;
	directory?: string;
}): Promise<{
	Command: string;
	Directory: string;
	Stdout: string;
	Stderr: string;
	Error: string;
	'Exit Code': number | null;
	Signal: number | null;
	'Background PIDs': number[];
}> {
	const {command, description, directory} = args;
	useProgressStore.getState().setProgress(`Executing command: ${command}`);

	// Check command restrictions from configuration
	const restrictionCheck = isCommandAllowed(command);
	if (!restrictionCheck.allowed) {
		return {
			Command: command,
			Directory: directory ? resolve(directory) : process.cwd(),
			Stdout: '',
			Stderr: '',
			Error: restrictionCheck.reason || 'Command not allowed',
			'Exit Code': null,
			Signal: null,
			'Background PIDs': [],
		};
	}

	// Check if command is potentially destructive
	if (isDestructiveCommand(command)) {
		return {
			Command: command,
			Directory: directory ? resolve(directory) : process.cwd(),
			Stdout: '',
			Stderr: '',
			Error:
				'Command execution cancelled - potentially destructive command detected',
			'Exit Code': null,
			Signal: null,
			'Background PIDs': [],
		};
	}

	const cwd = directory ? resolve(directory) : process.cwd();

	// Check if this is a background command (ends with &)
	const isBackground = command.trim().endsWith(' &');
	const cleanCommand = isBackground
		? command.trim().slice(0, -1).trim()
		: command;

	// Create environment with BERKELIUM_CLI=1 for subprocess
	const env = createShellEnvironment();

	if (isBackground) {
		// Handle background processes
		return new Promise(resolve => {
			const isWindows = process.platform === 'win32';
			const shell = isWindows ? 'cmd.exe' : 'bash';
			const shellFlag = isWindows ? '/c' : '-c';

			const child = spawn(shell, [shellFlag, cleanCommand], {
				cwd,
				env,
				detached: true,
				stdio: 'ignore',
			});

			child.unref();
			useProgressStore.getState().setProgress(`Started background process with PID: ${child.pid}`);

			resolve({
				Command: command,
				Directory: cwd,
				Stdout: '',
				Stderr: '',
				Error: '',
				'Exit Code': null,
				Signal: null,
				'Background PIDs': [child.pid || 0],
			});
		});
	} else {
		// Handle foreground processes
		try {
			const options = {
				cwd,
				env,
				timeout: 30000, // 30 seconds timeout
				maxBuffer: 1024 * 1024, // 1MB max buffer
			};

			const {stdout, stderr} = await execAsync(command, options);
			useProgressStore.getState().setProgress(`Command execution finished`);

			return {
				Command: command,
				Directory: cwd,
				Stdout: stdout || '',
				Stderr: stderr || '',
				Error: '',
				'Exit Code': 0,
				Signal: null,
				'Background PIDs': [],
			};
		} catch (error: any) {
			const exitCode = error.code !== undefined ? error.code : null;
			const signal = error.signal !== undefined ? error.signal : null;

			let errorMessage = '';
			if (error.message && error.message.includes('timeout')) {
				errorMessage = `Command timed out after 30 seconds`;
			} else if (error.message) {
				errorMessage = error.message;
			}
			useProgressStore.getState().setProgress(errorMessage);

			return {
				Command: command,
				Directory: cwd,
				Stdout: error.stdout || '',
				Stderr: error.stderr || '',
				Error: errorMessage,
				'Exit Code': exitCode,
				Signal: signal,
				'Background PIDs': [],
			};
		}
	}
}
