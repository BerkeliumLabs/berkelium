import { readFile as fsReadFile, writeFile as fsWriteFile, access, mkdir, readdir, stat, unlink } from 'fs/promises';
import { constants } from 'fs';
import { resolve, dirname, join } from 'path';
import confirm from '@inquirer/confirm';
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

/**
 * List the contents of a directory
 */
export async function listDirectory(
  directoryPath: string,
  showHidden: boolean = false
): Promise<ToolResult> {
  try {
    // Resolve the path to handle relative paths
    const resolvedPath = resolve(directoryPath);
    
    // Check if directory exists and is readable
    await access(resolvedPath, constants.F_OK | constants.R_OK);
    
    // Read directory contents
    const entries = await readdir(resolvedPath);
    
    // Filter hidden files if not requested
    const filteredEntries = showHidden 
      ? entries 
      : entries.filter(entry => !entry.startsWith('.'));
    
    if (filteredEntries.length === 0) {
      return {
        success: true,
        output: `Directory ${directoryPath} is empty${showHidden ? '' : ' (hidden files not shown)'}`
      };
    }
    
    // Get detailed information for each entry
    const entryDetails = await Promise.all(
      filteredEntries.map(async (entry) => {
        try {
          const entryPath = join(resolvedPath, entry);
          const stats = await stat(entryPath);
          const type = stats.isDirectory() ? 'DIR' : 'FILE';
          const size = stats.isFile() ? ` (${stats.size} bytes)` : '';
          return `${type.padEnd(4)} ${entry}${size}`;
        } catch {
          return `?    ${entry} (unable to read details)`;
        }
      })
    );
    
    const output = [
      `Contents of ${directoryPath}:`,
      `Found ${filteredEntries.length} item(s)${showHidden ? ' (including hidden)' : ''}`,
      '',
      ...entryDetails
    ].join('\n');
    
    return {
      success: true,
      output
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('ENOENT')) {
      return {
        success: false,
        output: '',
        error: `Directory not found: ${directoryPath}`
      };
    }
    
    if (errorMessage.includes('EACCES')) {
      return {
        success: false,
        output: '',
        error: `Permission denied: Cannot read directory ${directoryPath}`
      };
    }
    
    if (errorMessage.includes('ENOTDIR')) {
      return {
        success: false,
        output: '',
        error: `Not a directory: ${directoryPath}`
      };
    }
    
    return {
      success: false,
      output: '',
      error: `Failed to list directory ${directoryPath}: ${errorMessage}`
    };
  }
}

/**
 * Create a new directory
 */
export async function createDirectory(
  directoryPath: string,
  recursive: boolean = true
): Promise<ToolResult> {
  try {
    // Resolve the path to handle relative paths
    const resolvedPath = resolve(directoryPath);
    
    // Create the directory
    await mkdir(resolvedPath, { recursive });
    
    return {
      success: true,
      output: `Successfully created directory: ${directoryPath}`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('EEXIST')) {
      return {
        success: true,
        output: `Directory already exists: ${directoryPath}`
      };
    }
    
    if (errorMessage.includes('EACCES')) {
      return {
        success: false,
        output: '',
        error: `Permission denied: Cannot create directory ${directoryPath}`
      };
    }
    
    if (errorMessage.includes('ENOENT') && !recursive) {
      return {
        success: false,
        output: '',
        error: `Parent directory does not exist: ${directoryPath}. Try setting recursive to true.`
      };
    }
    
    return {
      success: false,
      output: '',
      error: `Failed to create directory ${directoryPath}: ${errorMessage}`
    };
  }
}

/**
 * Get user confirmation for file deletion
 */
async function getDeleteConfirmation(filePath: string): Promise<boolean> {
  console.log(`\n⚠️  WARNING: You are about to delete a file:`);
  console.log(`   ${filePath}`);
  console.log(`   This action cannot be undone.`);
  
  return await confirm({
    message: 'Are you sure you want to delete this file?',
    default: false
  });
}

/**
 * Delete a file from the file system
 */
export async function deleteFile(filePath: string): Promise<ToolResult> {
  try {
    // Resolve the path to handle relative paths
    const resolvedPath = resolve(filePath);
    
    // Check if file exists
    await access(resolvedPath, constants.F_OK);
    
    // Get user confirmation
    const confirmed = await getDeleteConfirmation(filePath);
    if (!confirmed) {
      return {
        success: false,
        output: '',
        error: 'File deletion cancelled by user'
      };
    }
    
    // Delete the file
    await unlink(resolvedPath);
    
    return {
      success: true,
      output: `Successfully deleted file: ${filePath}`
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
        error: `Permission denied: Cannot delete file ${filePath}`
      };
    }
    
    if (errorMessage.includes('EISDIR')) {
      return {
        success: false,
        output: '',
        error: `Cannot delete directory with deleteFile: ${filePath}. Use a directory removal tool instead.`
      };
    }
    
    return {
      success: false,
      output: '',
      error: `Failed to delete file ${filePath}: ${errorMessage}`
    };
  }
}
