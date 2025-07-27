import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { writeFile } from "./fileSystem.js";

// Schema for writing files
const writeFileSchema = z.object({
  filePath: z.string().describe("The path to the file to write"),
  content: z.string().describe("The content to write to the file"),
  createDirectories: z.boolean().optional().default(true).describe("Whether to create parent directories if they don't exist")
});

// @ts-ignore
const writeFileTool = tool(
  writeFile,
  {
    name: "writeFile",
    description: "Write content to a file on the local file system. Use this when the user asks to create a new file, modify an existing file, or save content to a specific location.",
    schema: writeFileSchema
  }
);

export const tools = [writeFileTool];
