# Berkelium Project Overview

This document provides a comprehensive overview of the Berkelium project, its architecture, and development conventions.

## Project Overview

Berkelium is an AI-powered command-line interface (CLI) tool designed to act as a coding companion. It leverages the Google Gemini API to provide intelligent assistance with a variety of development tasks. The project is built using Node.js and TypeScript, with the user interface rendered in the terminal using Ink, a React-based renderer for command-line apps.

### Core Technologies

- **Node.js:** The runtime environment for the application.
- **TypeScript:** The primary programming language, providing static typing and modern JavaScript features.
- **React (with Ink):** Used to build the interactive command-line interface.
- **LangChain:** A framework for developing applications powered by language models. It is used to interact with the Google Gemini API and manage the agent's tools.
- **esbuild:** A fast JavaScript bundler and minifier used for the build process.
- **Zustand:** A small, fast and scalable bearbones state-management solution.

### Architecture

The project is structured into several key directories:

- `source/`: Contains the core source code of the application.
  - `core/`: Handles the main logic of the AI agent, including routing prompts and interacting with the language model.
    - `agent.ts`: The core of the application, responsible for generating responses using the LangChain agent.
    - `router.ts`: Routes user prompts to the appropriate handler, either setting a persona or generating a response.
  - `cli.tsx`: The main entry point for the CLI application.
  - `shell.tsx`: The main component of the CLI, which handles the user interface and input.
  - `tools/`: Defines the tools that the AI agent can use, such as file system operations and web search.
  - `store/`: Contains the state management stores for the application.
  - `utils/`: Contains utility functions, such as configuration management and help commands.
- `scripts/`: Contains build scripts for development and production.
- `assets/`: Contains static assets, such as personas for the AI agent.
- `types/`: Contains TypeScript type definitions.

## Building and Running

The following commands are used to build, run, and test the project.

- **Install dependencies:**

  ```bash
  npm install
  ```

- **Run in development mode:**

  ```bash
  npm run dev
  ```

- **Build for production:**

  ```bash
  npm run build:prod
  ```

- **Run the production build:**

  ```bash
  npm start
  ```

- **Run tests:**
  ```bash
  npm test
  ```

## Development Conventions

### Coding Style

The project uses Prettier for code formatting and XO for linting. The configuration for these tools can be found in `package.json`.

### Testing

The project uses Ava for testing. Test files are located in the root of the project and have a `.tsx` extension.

### State Management

The project uses Zustand for state management. Stores are located in the `source/store/` directory.
