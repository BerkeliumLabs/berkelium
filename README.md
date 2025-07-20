# Berkelium - Agentic AI Code Assistant CLI

🧪 An intelligent, agentic AI assistant directly within your terminal, leveraging Node.js, TypeScript, and the Google Gemini API to streamline coding workflows.

## Features (Sprint 1 - MVP)

- ✅ Interactive REPL loop with natural language interaction
- ✅ Direct integration with Google Gemini AI (gemini-2.0-flash)
- ✅ Conversation history and context management
- ✅ Graceful error handling and user-friendly messages
- ✅ TypeScript support with full type safety

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
- Use `exit` or `quit` to leave the application
- Press `Ctrl+C` to exit at any time

### Example Session

```
🧪 Welcome to Berkelium - Agentic AI Code Assistant
Type your questions or commands. Use "exit" or "quit" to leave.

> What is TypeScript?
🤔 Thinking...

🧪 Berkelium: TypeScript is a strongly typed programming language that builds on JavaScript...

> Can you help me write a function to reverse a string?
🤔 Thinking...

🧪 Berkelium: Certainly! Here's a TypeScript function to reverse a string...
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
├── berkelium.ts          # Main CLI application
├── gemini-client.ts      # Gemini AI client wrapper
└── context-manager.ts    # Conversation history management
```

## License

MIT

## Contributing

This project is part of Sprint 1 implementation. Future sprints will add:
- Tool use (file system operations, shell commands)
- Advanced context management
- Project-specific configurations
- And much more!
