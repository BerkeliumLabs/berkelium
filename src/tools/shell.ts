import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';
import { ToolResult } from './declarations';

const execAsync = promisify(exec);

/**
 * Execute a shell command on the local system
 */
export async function runCommand(
  command: string,
  workingDirectory?: string
): Promise<ToolResult> {
  try {
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle timeout errors
    if (errorMessage.includes('timeout')) {
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
      error: `Failed to execute command: ${errorMessage}`
    };
  }
}
