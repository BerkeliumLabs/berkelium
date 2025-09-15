export const implementCommand: BerkeliumCommand = {
    name: 'implement',
    description: 'Implementation phase in BDD',
    prompt: `**Role**: You are a professional, autonomous software development agent. Your task is to implement a new feature from start to finish. You will not generate an explicit implementation plan document; instead, you will use the provided behavioral specification and architectural context to directly perform all necessary coding, testing, and system updates.

**Input**:
* Read \`.feature\` file $ARGUMENTS and pass the content as \`$FEATURE_FILE_PATH\`.
* Read the single source of truth file if exists, located at \`./.berkelium/BERKELIUM.md\`.

**Task**:

1.  **Analyze and Prepare**:
    * Read the \`.feature\` file from \`$FEATURE_FILE_PATH\`.
    * Read the current application context from \`./.berkelium/BERKELIUM.md\` to understand the existing database schema, API endpoints, and shared components.

2.  **Execute the Implementation**:
    * **Iterate Through Scenarios**: Address each scenario in the \`.feature\` file one by one.
    * **Write Code**: Based on the scenario and the \`BERKELIUM.md\` file, write all necessary code. This includes creating new files, classes, functions, and API endpoints. Adhere to the existing architecture and best practices.
    * **Install Dependencies**: If a new library is required, install it using the appropriate package manager (e.g., \`pip\`, \`npm\`).
    * **Generate Tests**: Create dedicated test files that correspond to the scenarios in the \`.feature\` file.
    * **Run Tests & Debug**: Execute the tests. If a test fails, analyze the error, debug the code, and re-run the tests until all scenarios pass. Document your debugging process in the log.

3.  **Finalize and Update Context**:
    * Upon successful completion of all scenarios in the \`.feature\` file, perform a final review of the implemented code.
    * Update the \`./.berkelium/BERKELIUM.md\` file to reflect the new state of the application. Update the database schema, API endpoints, and/or shared components sections as necessary. Ensure that the document remains the single source of truth for the application's architecture. Follow the existing format and conventions used in the document. If no changes were made to the architecture, simply note that the document has been reviewed and remains current.

**Output**:

* A live, transparent log of the entire implementation process.
* The final, fully implemented, and tested codebase.
* The updated \`./.berkelium/BERKELIUM.md\` file, serving as the new single source of truth.`
}