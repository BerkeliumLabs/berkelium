import { readFile, access } from 'fs/promises';
import { join, resolve } from 'path';
import { constants } from 'fs';
import { logger } from './logger';

/**
 * Manages project-specific instructions and configuration
 */
export class ProjectInstructions {
  private static readonly BERKELIUM_FOLDER = '.berkelium';
  private static readonly INSTRUCTIONS_FILE = 'BERKELIUM.md';
  private static readonly MAX_INSTRUCTIONS_SIZE = 100 * 1024; // 100KB limit

  private static cachedInstructions: string | null = null;
  private static lastCheckedPath: string | null = null;

  /**
   * Find and load project-specific instructions
   */
  static async loadProjectInstructions(workingDirectory: string = process.cwd()): Promise<string | null> {
    try {
      // Check if we already have cached instructions for this path
      if (this.cachedInstructions && this.lastCheckedPath === workingDirectory) {
        logger.debug('PROJECT_INSTRUCTIONS', 'Using cached project instructions');
        return this.cachedInstructions;
      }

      const projectPath = await this.findProjectInstructionsFile(workingDirectory);
      
      if (!projectPath) {
        logger.debug('PROJECT_INSTRUCTIONS', 'No project instructions found', { workingDirectory });
        this.cachedInstructions = null;
        this.lastCheckedPath = workingDirectory;
        return null;
      }

      const instructions = await this.readInstructionsFile(projectPath);
      
      // Cache the results
      this.cachedInstructions = instructions;
      this.lastCheckedPath = workingDirectory;
      
      logger.info('PROJECT_INSTRUCTIONS', 'Project instructions loaded', { 
        filePath: projectPath,
        contentLength: instructions?.length || 0
      });

      return instructions;
    } catch (error) {
      logger.warn('PROJECT_INSTRUCTIONS', 'Failed to load project instructions', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        workingDirectory
      });
      return null;
    }
  }

  /**
   * Find the BERKELIUM.md file by searching up the directory tree
   */
  private static async findProjectInstructionsFile(startPath: string): Promise<string | null> {
    let currentPath = resolve(startPath);
    
    // Search up to 10 levels to prevent infinite loops
    for (let level = 0; level < 10; level++) {
      const berkeliumFolderPath = join(currentPath, this.BERKELIUM_FOLDER);
      const instructionsFilePath = join(berkeliumFolderPath, this.INSTRUCTIONS_FILE);
      
      try {
        await access(instructionsFilePath, constants.F_OK | constants.R_OK);
        logger.debug('PROJECT_INSTRUCTIONS', 'Found instructions file', { 
          filePath: instructionsFilePath,
          searchLevel: level
        });
        return instructionsFilePath;
      } catch {
        // File doesn't exist or is not readable, continue searching
      }
      
      const parentPath = resolve(currentPath, '..');
      
      // Stop if we've reached the root directory
      if (parentPath === currentPath) {
        break;
      }
      
      currentPath = parentPath;
    }
    
    return null;
  }

  /**
   * Read and validate the instructions file
   */
  private static async readInstructionsFile(filePath: string): Promise<string | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      
      // Check file size limit
      if (content.length > this.MAX_INSTRUCTIONS_SIZE) {
        logger.warn('PROJECT_INSTRUCTIONS', 'Instructions file too large, truncating', { 
          filePath,
          originalSize: content.length,
          maxSize: this.MAX_INSTRUCTIONS_SIZE
        });
        return content.substring(0, this.MAX_INSTRUCTIONS_SIZE) + '\n\n[Content truncated due to size limit]';
      }
      
      return content.trim();
    } catch (error) {
      logger.error('PROJECT_INSTRUCTIONS', 'Failed to read instructions file', { 
        filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Clear cached instructions (useful when the file might have changed)
   */
  static clearCache(): void {
    this.cachedInstructions = null;
    this.lastCheckedPath = null;
    logger.debug('PROJECT_INSTRUCTIONS', 'Cache cleared');
  }

  /**
   * Check if project instructions exist for the given directory
   */
  static async hasProjectInstructions(workingDirectory: string = process.cwd()): Promise<boolean> {
    const filePath = await this.findProjectInstructionsFile(workingDirectory);
    return filePath !== null;
  }

  /**
   * Get the path to the project instructions file if it exists
   */
  static async getProjectInstructionsPath(workingDirectory: string = process.cwd()): Promise<string | null> {
    return await this.findProjectInstructionsFile(workingDirectory);
  }

  /**
   * Format project instructions for inclusion in AI context
   */
  static formatInstructionsForContext(instructions: string): string {
    return `\n--- Project-Specific Instructions ---\n${instructions}\n--- End Project Instructions ---\n`;
  }
}
