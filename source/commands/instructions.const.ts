export const INSTRCTION_FILE_PROMPT = `Generate project instructions file.

### **Instructions**

**1. Initial Project Scan & File Analysis**
* **List Files and Directories**: Start by listing all directories and files in the current project.
* **Handle Empty Projects**: If there are no existing files (an empty project), don't perform the scanning steps. Instead, directly generate a \`./.berkelium/BERKELIUM.md\` file using a pre-defined template. This template should contain generic placeholders for all the relevant sections, ready to be filled in by the user or the agent during the discovery phase. This ensures the workflow is consistent even on a fresh project. If it's not empty, proceed to the next steps.
* **Filter Out Irrelevant Paths**: Ignore any files or directories specified in the \`.gitignore\` file. Also, ignore the following folders: \`.git\`, \`.qwen\`, \`.gemini\`, \`.claude\`, \`.github\`, and \`.berkelium\`.
* **Read and Summarize**: If files exist, read them. Analyze the file content to understand the purpose of key files. Don't just list the file; briefly explain what it does (e.g., \`app.py\`: "Main application entry point for the API.").

***

**2. Contextual Information Gathering**
* **Identify Technology Stack**: Based on the files you've read (\`package.json\`, \`requirements.txt\`, etc.), identify the technology stack. This includes **programming languages**, **frameworks**, **libraries**, and the **database** used.
* **Identify Database Schema**: If database-related files are present (e.g., SQL migration scripts, ORM models), identify the database schema. List the **tables**, their **columns**, and any **relationships**.
* **Identify API Endpoints**: Scan for API route definitions. List the **endpoints**, their **HTTP methods**, and a brief description of their function.
* **Identify Shared Components**: Look for utility functions or common classes that are used across the project. Identify these **shared components** and briefly describe their purpose.

***

**3. Generate the instruction File**
* **Compile Information**: Consolidate all the gathered information into a structured document.

# Output:
Instructions should be saved as:
- If $ARGUMENTS is equal to github save file to \`./.github/copilot-instructions.md\`
- If $ARGUMENTS is equal to claude save file to \`./CLAUDE.md\`.
- If $ARGUMENTS is equal to gemini save file to \`./GEMINI.md\`
- If $ARGUMENTS is equal to qwen save file to \`./QWEN.md\`
- Else do not generate a file and tell user that the $ARGUMENTS is not supported and tell them supported arguments.
**Importatnt**: File name should be capital for CLAUDE.md, GEMINI.md, and QWEN.md.

# Template:
Instructions should be generated according to the following template:

\`\`\`md
# 🏛️ Application Context: Single Source of Truth

This document serves as the master record of the application's current architecture and shared components.

***

## 📋 [Project Name]
[Introduction for the project]

## ⚙️ 1. Technology Stack

[example]
This section outlines the core technologies used in this project. All new code should adhere to this stack for consistency.
* **Backend**: Python 3.9, FastAPI
* **Frontend**: React 18, TypeScript, Redux Toolkit
* **Database**: PostgreSQL 14, SQLAlchemy ORM
* **Testing**: Pytest (for backend), Jest (for frontend)
* **Containerization**: Docker
[example]

***

## 🗂️ 2. Project Structure

[example]
This outlines the high-level directory and file structure of the project. This helps the AI agent understand where to place new files and where to find existing ones.

* \`src/\`: Contains the application's core source code.
    * \`api/\`: Defines all API endpoint routes.
    * \`models/\`: Contains database models and schemas.
    * \`services/\`: Holds business logic and core functionality.
    * \`utils/\`: Stores shared utility functions and helper modules.
* \`tests/\`: Contains all feature and unit tests.
    * \`features/\`: BDD tests (\`.feature\` files).
    * \`unit/\`: Unit tests for individual components.
[example]

***

## 💾 3. Database Schema
[example]
This section outlines the current state of the database, including tables, their columns, data types, and relationships.

* **Table: \`users\`**
    * **Description**: Stores user account information.
    * **Fields**:
        * \`id\` (UUID, Primary Key)
        * \`email\` (VARCHAR, Unique, NOT NULL)
        * \`password_hash\` (VARCHAR, NOT NULL)
* **Table: \`profiles\`**
    * **Description**: Stores additional user profile details.
    * **Fields**:
        * \`user_id\` (UUID, Primary Key, Foreign Key to \`users.id\`)
        * \`first_name\` (VARCHAR)
        * \`last_name\` (VARCHAR)
[example]

***

## 🌐 4. API Endpoints
[example]
This section lists all implemented API endpoints, their methods, and expected request/response formats.

* **Endpoint: \`POST /api/v1/auth/register\`**
    * **Description**: Creates a new user account.
    * **Request Body**: \`{"email": "string", "password": "string"}\`
    * **Response**: \`{"user_id": "uuid", "message": "User created successfully."}\`
* **Endpoint: \`POST /api/v1/auth/login\`**
    * **Description**: Authenticates a user and returns a token.
    * **Request Body**: \`{"email": "string", "password": "string"}\`
    * **Response**: \`{"token": "string"}\`
[example]

***

## 🧩 5. Shared Components & Utilities
[example]
This section details reusable code components, services, or functions that are available for use across different features.

* **Module**: \`src/services/auth_service.py\`
    * **Description**: Provides functions for hashing passwords and generating authentication tokens.
    * **Functions**: \`hash_password(password)\`, \`generate_token(user_id)\`
* **Module**: \`src/utils/db_connection.py\`
    * **Description**: Contains the \`get_db_connection()\` function to manage database sessions.
[example]

***

## Rules

Strinctly follow these rules:

- Update this file once a code implementation is successfully completed, to reflect the new state of the application. Update the database schema, API endpoints, and/or shared components sections as necessary. Ensure that the document remains the single source of truth for the application's architecture. Follow the existing format and conventions used in the document. If no changes were made to the architecture, simply note that the document has been reviewed and remains current.

Document last updated: [Date & Time]
\`\`\``;