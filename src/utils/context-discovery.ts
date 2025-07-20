import { readFile, stat, readdir } from 'fs/promises';
import { join, extname, basename } from 'path';

/**
 * Context discovery utilities for automatically including relevant files
 */
export class ContextDiscovery {
  // File extensions that are typically relevant for code context
  private static readonly RELEVANT_EXTENSIONS = [
    '.md', '.txt', '.json', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
    '.css', '.html', '.xml', '.yaml', '.yml', '.toml', '.ini', '.env', '.gitignore'
  ];

  // Files that are typically important for project context
  private static readonly IMPORTANT_FILES = [
    'README.md', 'readme.md', 'package.json', 'tsconfig.json', 'pyproject.toml',
    'Cargo.toml', 'composer.json', 'pom.xml', 'build.gradle', 'Makefile',
    '.gitignore', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md'
  ];

  // Maximum file size to include (50KB)
  private static readonly MAX_FILE_SIZE = 50 * 1024;

  // Maximum total context size (200KB)
  private static readonly MAX_TOTAL_CONTEXT = 200 * 1024;

  /**
   * Discover relevant files in the current directory
   */
  static async discoverRelevantFiles(directoryPath: string = process.cwd()): Promise<string[]> {
    try {
      const entries = await readdir(directoryPath);
      const relevantFiles: string[] = [];

      for (const entry of entries) {
        const filePath = join(directoryPath, entry);
        
        try {
          const stats = await stat(filePath);
          
          // Skip directories and large files
          if (stats.isDirectory() || stats.size > this.MAX_FILE_SIZE) {
            continue;
          }

          // Check if file is relevant
          if (this.isRelevantFile(entry)) {
            relevantFiles.push(filePath);
          }
        } catch {
          // Skip files we can't read
          continue;
        }
      }

      // Sort by importance (important files first)
      return relevantFiles.sort((a, b) => {
        const aImportant = this.IMPORTANT_FILES.includes(basename(a));
        const bImportant = this.IMPORTANT_FILES.includes(basename(b));
        
        if (aImportant && !bImportant) return -1;
        if (!aImportant && bImportant) return 1;
        return a.localeCompare(b);
      });
    } catch {
      return [];
    }
  }

  /**
   * Check if a file is relevant for context
   */
  private static isRelevantFile(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    const name = basename(filename).toLowerCase();
    
    // Important files are always relevant
    if (this.IMPORTANT_FILES.includes(name)) {
      return true;
    }

    // Check extension
    return this.RELEVANT_EXTENSIONS.includes(ext);
  }

  /**
   * Read and prepare context from discovered files
   */
  static async prepareFileContext(filePaths: string[]): Promise<string> {
    const contextParts: string[] = [];
    let totalSize = 0;

    for (const filePath of filePaths) {
      try {
        const content = await readFile(filePath, 'utf-8');
        
        // Check if adding this file would exceed the limit
        if (totalSize + content.length > this.MAX_TOTAL_CONTEXT) {
          break;
        }

        const filename = basename(filePath);
        const contextEntry = `=== ${filename} ===\n${content}\n`;
        contextParts.push(contextEntry);
        totalSize += content.length;
      } catch {
        // Skip files we can't read
        continue;
      }
    }

    return contextParts.length > 0 
      ? `\n--- Current Directory Context ---\n${contextParts.join('\n')}\n--- End Context ---\n`
      : '';
  }
}
