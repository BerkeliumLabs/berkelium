import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

/**
 * Tool declarations for Gemini API function calling
 */
export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'readFile',
    description: 'Read the contents of a file from the local file system. Use this when the user asks to examine, analyze, or view the contents of a specific file.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        filePath: {
          type: SchemaType.STRING,
          description: 'The absolute or relative path to the file to read'
        }
      },
      required: ['filePath']
    }
  },
  {
    name: 'writeFile',
    description: 'Write content to a file on the local file system. Use this when the user asks to create a new file, modify an existing file, or save content to a specific location.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        filePath: {
          type: SchemaType.STRING,
          description: 'The absolute or relative path where the file should be written'
        },
        content: {
          type: SchemaType.STRING,
          description: 'The content to write to the file'
        },
        createDirectories: {
          type: SchemaType.BOOLEAN,
          description: 'Whether to create parent directories if they don\'t exist (default: true)'
        }
      },
      required: ['filePath', 'content']
    }
  },
  {
    name: 'runCommand',
    description: 'Execute a shell command on the local system. Use this for running CLI tools, building projects, installing packages, or performing system operations.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        command: {
          type: SchemaType.STRING,
          description: 'The shell command to execute'
        },
        workingDirectory: {
          type: SchemaType.STRING,
          description: 'The working directory to run the command in (optional, defaults to current directory)'
        }
      },
      required: ['command']
    }
  }
];

/**
 * Available tool names for type checking
 */
export type ToolName = 'readFile' | 'writeFile' | 'runCommand';

/**
 * Tool execution result interface
 */
export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}
