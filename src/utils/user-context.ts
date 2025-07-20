import { readFile } from 'fs/promises';
import { resolve, basename } from 'path';

/**
 * Utilities for parsing and handling user-defined context
 */
export class UserContextParser {
  // Regex to match @filename or @path/filename patterns
  private static readonly FILE_REFERENCE_REGEX = /@([^\s]+)/g;

  /**
   * Parse user input to extract file references
   */
  static parseFileReferences(input: string): string[] {
    const matches = [...input.matchAll(this.FILE_REFERENCE_REGEX)];
    return matches.map(match => match[1]);
  }

  /**
   * Process user input to replace @file references with actual file content
   */
  static async processUserInput(input: string): Promise<string> {
    const fileReferences = this.parseFileReferences(input);
    
    if (fileReferences.length === 0) {
      return input;
    }

    let processedInput = input;
    const fileContents: string[] = [];

    for (const fileRef of fileReferences) {
      try {
        const filePath = resolve(fileRef);
        const content = await readFile(filePath, 'utf-8');
        const filename = basename(filePath);
        
        // Replace the @file reference with a placeholder
        processedInput = processedInput.replace(
          new RegExp(`@${fileRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
          `[file: ${filename}]`
        );

        // Add file content to the context
        fileContents.push(`=== Content of ${filename} ===\n${content}\n=== End of ${filename} ===`);
      } catch (error) {
        // If file can't be read, replace with error message
        processedInput = processedInput.replace(
          new RegExp(`@${fileRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
          `[file: ${fileRef} - ERROR: Could not read file]`
        );
      }
    }

    // Append file contents at the end
    if (fileContents.length > 0) {
      processedInput += '\n\n--- Referenced Files ---\n' + fileContents.join('\n') + '\n--- End Referenced Files ---';
    }

    return processedInput;
  }

  /**
   * Extract just the file references without processing the full input
   */
  static extractFileReferences(input: string): { reference: string; exists: boolean }[] {
    const fileReferences = this.parseFileReferences(input);
    
    return fileReferences.map(fileRef => ({
      reference: fileRef,
      exists: true // We'll check this when processing
    }));
  }

  /**
   * Check if input contains file references
   */
  static hasFileReferences(input: string): boolean {
    return this.FILE_REFERENCE_REGEX.test(input);
  }
}
