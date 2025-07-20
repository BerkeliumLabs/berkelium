# Berkelium - Agentic AI Code Assistant CLI

🧪 An intelligent, agentic AI assistant directly within your terminal, leveraging Node.js, TypeScript, and the Google Gemini API to streamline coding workflows.

## Features

- ✅ Interactive REPL loop with natural language interaction
- ✅ Direct integration with Google Gemini AI (gemini-2.0-flash)
- ✅ Agentic loop with tool execution
- ✅ **Enhanced file system operations** (read/write/list/create/delete)
- ✅ **Shell command execution with safety controls**
- ✅ **User confirmation for destructive operations**
- ✅ **Progress indicators and enhanced UI feedback**
- ✅ Conversation history and context management
- ✅ Graceful error handling and user-friendly messages
- ✅ TypeScript support with full type safety

### Available Tools

- **readFile(filePath)** - Read content from any file
- **writeFile(filePath, content)** - Write content to files (creates directories automatically)
- **listDirectory(directoryPath, showHidden?)** - List directory contents with file details
- **createDirectory(directoryPath, recursive?)** - Create directories with optional recursion
- **deleteFile(filePath)** - Delete files with user confirmation
- **runCommand(command, workingDirectory?)** - Execute shell commands with destructive command protection

### Safety Features

- 🛡️ **Destructive Command Detection**: Automatically identifies potentially dangerous commands
- 🔒 **User Confirmation**: Prompts for confirmation before executing destructive operations
- ⏱️ **Timeout Protection**: Commands limited to 30 seconds to prevent hanging
- 🔄 **Progress Indicators**: Visual feedback during AI processing and tool execution

## Installation

1. Clone the repository:
```bash
git clone https://github.com/BerkeliumLabs/berkelium.git
cd berkelium
```

2. Install dependencies:
```bash
npm install
```

3. Set up your Gemini API key:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your actual Gemini API key
# GEMINI_API_KEY=your_actual_api_key_here
```

4. Build the project:
```bash
npm run build
```

## Usage

Start Berkelium in interactive mode:
```bash
npm start
```

Or run directly:
```bash
node dist/berkelium.js
```

### Commands

- Type any question or coding request
- Ask Berkelium to read, write, or analyze files
- Request shell command execution
- Use `exit` or `quit` to leave the application
- Press `Ctrl+C` to exit at any time

### Example Sessions

#### File Operations
```
> Read the package.json file and tell me about the dependencies

🤔 Thinking...
🔧 Executing tool: readFile
✅ Tool executed successfully
📄 Output: {
  "name": "berkelium",
  "version": "0.1.0",
  ...

🧪 Berkelium: I can see your package.json file. You have several dependencies including @google/generative-ai for AI integration, @inquirer/prompts for the CLI interface, and TypeScript for development...
```

#### Code Generation and File Writing
```
> Create a simple Express.js server in a new file called server.js

🤔 Thinking...
🔧 Executing tool: writeFile
✅ Tool executed successfully
📄 Output: Successfully wrote 324 characters to server.js

🧪 Berkelium: I've created a simple Express.js server for you in server.js. The server includes basic middleware setup, a hello world route, and starts listening on port 3000...
```

#### Enhanced Command Execution with Safety
```
> Run npm install express to add Express to this project

⠋ Thinking...
⠋ Executing runCommand...
✅ runCommand executed successfully
📄 Output: STDOUT:
added 1 package, and audited 77 packages in 2s

🧪 Berkelium: I've successfully installed Express in your project. The package has been added to your node_modules and package.json file...
```

#### File Operations with Safety
```
> List the files in the current directory and then delete the temporary file temp.txt

⠋ Thinking...
⠋ Executing listDirectory...
✅ listDirectory executed successfully
📄 Output: Contents of .:
Found 12 item(s)
DIR  src
FILE package.json (2247 bytes)
FILE temp.txt (15 bytes)
...

⠋ Executing deleteFile...
⚠️  WARNING: You are about to delete a file:
   temp.txt
   This action cannot be undone.
? Are you sure you want to delete this file? › No / Yes

✅ deleteFile executed successfully
📄 Output: Successfully deleted file: temp.txt

🧪 Berkelium: I've listed the directory contents and safely deleted the temp.txt file after confirming with you...
```

#### Destructive Command Protection
```
> Run the command "rm -rf *" to clean up everything

⠋ Thinking...
⠋ Executing runCommand...
⚠️  WARNING: This command may be destructive:
   rm -rf *
   This could modify, delete, or affect your system.
? Do you want to proceed with this command? › No / Yes

❌ runCommand execution failed: Command execution cancelled by user

🧪 Berkelium: I detected that this command could be destructive and requested your confirmation. Since you declined, the command was not executed. This helps protect your system from accidental damage...
```

## Development

- `npm run build` - Build the TypeScript project
- `npm run dev` - Build in watch mode
- `npm run clean` - Clean the dist directory

## Requirements

- Node.js 18.0.0 or higher
- Google Gemini API key

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

## Project Structure

```
src/
├── berkelium.ts          # Main CLI application with agentic loop
├── gemini-client.ts      # Gemini AI client wrapper with function calling
├── context-manager.ts    # Conversation history management
├── utils/
│   └── progress.ts       # Progress indicators and UI feedback
└── tools/
    ├── index.ts          # Tool registry and execution
    ├── declarations.ts   # Gemini API function declarations
    ├── fileSystem.ts     # File operations (read/write/list/create/delete)
    └── shell.ts          # Shell command execution with safety
```

## License

MIT

## Contributing

Sprint 3 has been completed! Current features include:
- ✅ Agentic loop with tool execution
- ✅ Enhanced file system operations (read/write/list/create/delete)
- ✅ Shell command execution with safety controls
- ✅ User confirmation for destructive operations
- ✅ Progress indicators and enhanced UI feedback
- ✅ Function calling integration with Gemini

Future sprints will add:
- Advanced context management and project indexing
- Version control integration (Git operations)
- Project-specific configurations
- IDE integrations
- Plugin system for custom tools
- And much more!
