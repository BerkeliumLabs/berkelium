import { tool } from "@langchain/core/tools";
import { readFile, writeFile, listDirectory, createDirectory, deleteFile } from "./fileSystem.js";
import { 
  readFileSchema, 
  writeFileSchema, 
  listDirectorySchema, 
  createDirectorySchema, 
  deleteFileSchema
} from "./schema.js";

// @ts-ignore
export const readFileTool = tool(
  readFile,
  {
    name: "readFile",
    description: "Read the contents of a file from the local file system. Use this when the user asks to see file contents or analyze existing code.",
    schema: readFileSchema
  }
);

// @ts-ignore
export const writeFileTool = tool(
  writeFile,
  {
    name: "writeFile",
    description: "Write content to a file on the local file system. Use this when the user asks to create a new file, modify an existing file, or save content to a specific location.",
    schema: writeFileSchema
  }
);

// @ts-ignore
export const listDirectoryTool = tool(
  listDirectory,
  {
    name: "listDirectory",
    description: "List the contents of a directory. Use this when the user asks to see what files and folders are in a directory.",
    schema: listDirectorySchema
  }
);

// @ts-ignore
export const createDirectoryTool = tool(
  createDirectory,
  {
    name: "createDirectory",
    description: "Create a new directory on the local file system. Use this when the user asks to create a folder or directory structure.",
    schema: createDirectorySchema
  }
);

// @ts-ignore
export const deleteFileTool = tool(
  deleteFile,
  {
    name: "deleteFile",
    description: "Delete a file from the local file system. Use this when the user asks to remove or delete a file. This will prompt for user confirmation.",
    schema: deleteFileSchema
  }
);

export const tools = [
  readFileTool,
  writeFileTool,
  listDirectoryTool,
  createDirectoryTool,
  deleteFileTool
];
