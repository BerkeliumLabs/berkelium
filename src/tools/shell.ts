import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';
import confirm from '@inquirer/confirm';
import { ToolResult } from './declarations';
import { ErrorHandler, ErrorCategory } from '../utils/error-handler';

const execAsync = promisify(exec);

/**
 * List of potentially destructive command patterns
 */
const DESTRUCTIVE_PATTERNS = [
  /^rm\s+.*-r/i,          // rm -r (recursive delete)
  /^rm\s+.*-f/i,          // rm -f (force delete)
  /^rmdir/i,              // rmdir
  /^del\s+/i,             // Windows del command
  /^rd\s+/i,              // Windows rd command
  /^format\s+/i,          // format command
  /^fdisk/i,              // fdisk
  /^mkfs/i,               // make filesystem
  /^dd\s+/i,              // dd command
  /^git\s+push\s+.*--force/i, // git force push
  /^git\s+reset\s+--hard/i,   // git hard reset
  /^npm\s+publish/i,          // npm publish
  /^yarn\s+publish/i,         // yarn publish
  /^docker\s+rmi/i,           // docker remove image
  /^docker\s+rm/i,            // docker remove container
  /^sudo\s+/i,                // sudo commands
  />\s*\/dev\/null/i,         // redirect to /dev/null
  /chmod\s+.*777/i,           // dangerous chmod
  /chown\s+.*-R/i             // recursive chown
];

/**
 * Check if a command is potentially destructive
 */
function isDestructiveCommand(command: string): boolean {
  return DESTRUCTIVE_PATTERNS.some(pattern => pattern.test(command.trim()));
}

/**
 * Get user confirmation for potentially destructive commands
 */
async function getDestructiveCommandConfirmation(command: string): Promise<boolean> {
  console.log(`\n⚠️  WARNING: This command may be destructive:`);
  console.log(`   ${command}`);
  console.log(`   This could modify, delete, or affect your system.`);
  
  return await confirm({
    message: 'Do you want to proceed with this command?',
    default: false
  });
}

/**
 * Execute a shell command on the local system
 */
export async function runCommand(
  command: string,
  workingDirectory?: string
): Promise<ToolResult> {
  try {
    // Check if command is potentially destructive and get user confirmation
    if (isDestructiveCommand(command)) {
      const confirmed = await getDestructiveCommandConfirmation(command);
      if (!confirmed) {
        return {
          success: false,
          output: '',
          error: 'Command execution cancelled by user'
        };
      }
    }

    // Resolve working directory if provided
    const cwd = workingDirectory ? resolve(workingDirectory) : process.cwd();
    
    // Set timeout to prevent hanging commands
    const options = {
      cwd,
      timeout: 30000, // 30 seconds timeout
      maxBuffer: 1024 * 1024 // 1MB max buffer
    };
    
    const { stdout, stderr } = await execAsync(command, options);
    
    // Combine stdout and stderr for the output
    let output = '';
    if (stdout) {
      output += `STDOUT:\n${stdout}`;
    }
    if (stderr) {
      output += stdout ? `\n\nSTDERR:\n${stderr}` : `STDERR:\n${stderr}`;
    }
    
    // If no output, indicate successful execution
    if (!output) {
      output = 'Command executed successfully (no output)';
    }
    
    return {
      success: true,
      output: output.trim()
    };
  } catch (error) {
    const berkeliumError = ErrorHandler.handle(error, ErrorCategory.SHELL_ERROR, {
      operation: 'runCommand',
      command,
      workingDirectory
    });

    // Handle specific error types
    if (berkeliumError.message.includes('timeout')) {
      return {
        success: false,
        output: '',
        error: `Command timed out after 30 seconds: ${command}`
      };
    }
    
    // Handle execution errors (non-zero exit codes)
    if (error && typeof error === 'object' && 'code' in error) {
      const execError = error as any;
      let output = '';
      if (execError.stdout) {
        output += `STDOUT:\n${execError.stdout}`;
      }
      if (execError.stderr) {
        output += execError.stdout ? `\n\nSTDERR:\n${execError.stderr}` : `STDERR:\n${execError.stderr}`;
      }
      
      return {
        success: false,
        output: output.trim(),
        error: `Command failed with exit code ${execError.code}: ${command}`
      };
    }
    
    return {
      success: false,
      output: '',
      error: berkeliumError.message
    };
  }
}
