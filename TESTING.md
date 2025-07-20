# Test Instructions for Berkelium Sprint 1

## Prerequisites

1. Ensure you have Node.js 18+ installed
2. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/)
3. Set up your environment file:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

## Manual Testing Steps

### Test 1: Basic Setup and Build
```bash
cd e:\Projects\berkelium
npm install
npm run build
```
**Expected**: No errors, `dist/` folder created with compiled JavaScript files.

### Test 2: REPL Loop (without API key)
```bash
# Don't set GEMINI_API_KEY yet
npm start
```
**Expected**: Error message about missing API key, graceful exit.

### Test 3: REPL Loop (with API key)
```bash
# Set GEMINI_API_KEY in .env file
npm start
```
**Expected**: 
- Welcome message displayed
- Prompt `>` appears
- Can type messages and get responses from Gemini
- `exit` or `quit` commands work
- Ctrl+C exits gracefully

### Test 4: Conversation History
1. Start the application
2. Ask: "What is TypeScript?"
3. Wait for response
4. Ask: "Can you give me an example of what you just explained?"
5. The AI should reference the previous conversation about TypeScript

### Test 5: Error Handling
1. Start with invalid API key
2. **Expected**: Clear error message about invalid key
3. Start with valid key but ask a very long question (>1000 words)
4. **Expected**: Should handle gracefully

## All Sprint 1 Tasks Completed ✅

- **Task 1.1**: ✅ Project Initialization & TypeScript Setup
  - package.json with correct dependencies
  - tsconfig.json with proper configuration
  - Project structure created

- **Task 1.2**: ✅ Implement Basic REPL Loop
  - Interactive prompt using @inquirer/prompts
  - Continuous loop until exit
  - User input handling

- **Task 1.3**: ✅ Gemini API Client Initialization
  - GoogleGenerativeAI client setup
  - gemini-2.0-flash-exp model initialization
  - Proper error handling for API key issues

- **Task 1.4**: ✅ Direct Gemini Text Interaction
  - Send user prompts to Gemini
  - Display AI responses
  - Error handling for API failures

- **Task 1.5**: ✅ Implement Conversation History (Basic)
  - ChatMessage interface and ContextManager class
  - Store user prompts and AI responses
  - Maintain conversational context

- **Task 1.6**: ✅ Exit Command
  - Graceful exit on 'exit' or 'quit'
  - Ctrl+C handling
  - Proper cleanup
