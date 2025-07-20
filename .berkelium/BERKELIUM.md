# Berkelium Project Instructions

## Project Overview
Berkelium is an agentic AI code assistant CLI built with Node.js, TypeScript, and Google Gemini AI. It provides intelligent terminal-based assistance with tool execution capabilities.

## Development Guidelines

### Code Style
- Use TypeScript with strict type checking
- Follow consistent naming conventions (camelCase for variables/functions, PascalCase for classes)
- Add comprehensive JSDoc comments for all public methods
- Use async/await for asynchronous operations
- Handle errors gracefully with try-catch blocks

### Architecture Principles
- **Modular Design**: Keep components separated (AI client, context manager, tools, utilities)
- **Safety First**: Always implement user confirmation for destructive operations
- **Logging**: Use the centralized logging system for debugging and monitoring
- **Error Handling**: Use the BerkeliumError system for consistent error management

### Testing Guidelines
- Write unit tests for core functionality
- Test error scenarios and edge cases
- Validate file operations with different path formats
- Test the agentic loop with various tool combinations

### Sprint Development Process
- Complete all tasks in a sprint before moving to the next
- Implement comprehensive error handling for all new features
- Add logging for new operations
- Update documentation and help text for new commands

### Current Focus Areas
- **Context Management**: Automatic file discovery and user-defined context
- **Tool Safety**: User confirmation for destructive operations
- **Robustness**: Comprehensive error handling and logging
- **User Experience**: Clear feedback and progress indicators

### File Organization
- `src/` - Main source code
- `src/tools/` - Tool implementations and declarations
- `src/utils/` - Utility modules (logging, error handling, etc.)
- `test/` - Test files and documentation
- `.berkelium/` - Project-specific configuration

## AI Assistant Guidelines
When working on this project:
1. Always maintain the existing architecture patterns
2. Add proper error handling and logging for new features
3. Follow the established TypeScript patterns
4. Test thoroughly before considering features complete
5. Update documentation when adding new functionality
6. Consider user experience and safety in all implementations
