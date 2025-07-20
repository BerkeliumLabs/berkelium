import { readFile as fsReadFile, writeFile as fsWriteFile, access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { resolve, dirname } from 'path';
import { ToolResult } from './declarations';

/**
 * Read the contents of a file from the local file system
 */
export async function readFile(filePath: string): Promise<ToolResult> {
  try {
    // Resolve the path to handle relative paths
    const resolvedPath = resolve(filePath);
    
    // Check if file exists and is readable
    await access(resolvedPath, constants.F_OK | constants.R_OK);
    
    // Read the file content
    const content = await fsReadFile(resolvedPath, 'utf-8');
    
    return {
      success: true,
      output: content
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('ENOENT')) {
      return {
        success: false,
        output: '',
        error: `File not found: ${filePath}`
      };
    }
    
    if (errorMessage.includes('EACCES')) {
      return {
        success: false,
        output: '',
        error: `Permission denied: Cannot read file ${filePath}`
      };
    }
    
    return {
      success: false,
      output: '',
      error: `Failed to read file ${filePath}: ${errorMessage}`
    };
  }
}

/**
 * Write content to a file on the local file system
 */
export async function writeFile(
  filePath: string, 
  content: string, 
  createDirectories: boolean = true
): Promise<ToolResult> {
  try {
    // Resolve the path to handle relative paths
    const resolvedPath = resolve(filePath);
    
    // Create parent directories if requested and they don't exist
    if (createDirectories) {
      const parentDir = dirname(resolvedPath);
      try {
        await mkdir(parentDir, { recursive: true });
      } catch (error) {
        // Ignore error if directory already exists
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (!errorMessage.includes('EEXIST')) {
          throw error;
        }
      }
    }
    
    // Write the file content
    await fsWriteFile(resolvedPath, content, 'utf-8');
    
    return {
      success: true,
      output: `Successfully wrote ${content.length} characters to ${filePath}`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('ENOENT')) {
      return {
        success: false,
        output: '',
        error: `Directory not found: Cannot write to ${filePath}. Try setting createDirectories to true.`
      };
    }
    
    if (errorMessage.includes('EACCES')) {
      return {
        success: false,
        output: '',
        error: `Permission denied: Cannot write to file ${filePath}`
      };
    }
    
    return {
      success: false,
      output: '',
      error: `Failed to write file ${filePath}: ${errorMessage}`
    };
  }
}
