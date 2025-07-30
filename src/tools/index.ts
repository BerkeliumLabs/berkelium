import { tool } from "@langchain/core/tools";
import { writeFile } from "./fileSystem.js";
import { writeFileSchema } from "./schema.js";

// @ts-ignore
export const writeFileTool = tool(
  writeFile,
  {
    name: "writeFile",
    description: "Write content to a file on the local file system. Use this when the user asks to create a new file, modify an existing file, or save content to a specific location.",
    schema: writeFileSchema
  }
);

export const tools = [writeFileTool];
