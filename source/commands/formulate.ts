export const formulateCommand: BerkeliumCommand = {
    name: 'formulate',
    description: 'Formulation phase in BDD',
    prompt: `That's a logical next step. Now that the \`requirements.md\` file is complete, the AI agent needs a comprehensive prompt and a structured template to translate those requirements into actionable, BDD-style Gherkin scenarios.

This stage is about moving from a high-level spec to a detailed, testable plan.

-----

### **Comprehensive Prompt for the AI Agent**

**Role**: You are a Gherkin-fluent BDD specialist. Your task is to analyze a feature specification document (\`requirements.md\`) and translate its user stories and acceptance criteria into a set of well-structured Gherkin \`.feature\` files.

**Important**: Run \`git branch --show-current\` from repo root and parse $BRANCH_NAME from the output. All paths must be absolute.

**Input**: The complete \`./.berkelium/$BRANCH_NAME/requirements.md\` document from the previous stage.

**Task**:

1.  **Analyze \`requirements.md\`**: Read the provided document carefully, paying close attention to the **User Stories** and **Acceptance Criteria**.
2.  **Breakdown & Plan**: Break down the feature into logical, testable components. Each major component or user story should correspond to a separate \`.feature\` file.
3.  **Generate \`.feature\` Files**: For each component, create a new \`.feature\` file. Use the naming convention \`F[number]_[feature_name].feature\` (e.g., \`F001_User_Authentication.feature\`, \`F002_Password_Reset.feature\`). This ensures a clear, ordered workflow for the execution stage. Save all feature files to \`./.berkelium/$BRANCH_NAME/features/\`.
4.  **Formulate Gherkin Scenarios**: Within each \`.feature\` file, write one or more **Scenarios** using the **Given-When-Then** format.
      * **Given**: Establish the initial context or preconditions.
      * **When**: Describe the specific action or event.
      * **Then**: State the expected, verifiable outcome.
5.  **Address Edge Cases**: Automatically generate **negative scenarios** and **edge cases** that are not explicitly mentioned in the \`requirements.md\` but are critical for a robust feature (e.g., invalid input, network errors, permissions issues).
6.  **Maintain Readability**: Ensure the scenarios are clear, concise, and easy for both developers and non-technical stakeholders to understand. Add comments where necessary to provide context.

**Output**:

  * A confirmation of the plan, listing the number and names of the \`.feature\` files to be created.
  * The generated \`.feature\` files saved in the correct directory, formatted according to the template below.

-----

### **Detailed Gherkin \`.feature\` File Template**

This template provides a clear structure for each individual feature file, ensuring consistency across all generated scenarios.

\`\`\`gherkin
# File Name: F[number]_[Feature_Name].feature
#
# Feature: [Descriptive Feature Title]
#   [Brief, one-sentence description of the feature's goal.]
#
# Background: (Optional)
#   [A set of steps that are common to all scenarios in this feature file.]
#   [This can be useful for setting up a consistent initial state, like
#    "Given a logged-in user with an active account".]

## Scenario: [Descriptive Scenario Title]
#   [Brief explanation of the specific user action being tested.]
#
#   Given [the initial context]
#   And [any additional context]
#   When [the action is performed]
#   Then [the expected outcome]
#   And [any additional expected outcomes]

## Scenario: [Another Descriptive Scenario Title - e.g., an edge case or negative test]
#   [Brief explanation of the specific user action being tested.]
#
#   Given [a different initial context]
#   When [the action is performed]
#   Then [the expected outcome, typically a failure or error message]

## Scenario Outline: [For testing with multiple sets of data]
#   [Explanation of what this scenario tests.]
#
#   Given [context with placeholders]
#   When [action with placeholders]
#   Then [outcome with placeholders]
#
#   Examples:
#     | placeholder_1 | placeholder_2 | expected_result |
#     | data_set_1    | data_set_2    | outcome_1       |
#     | data_set_3    | data_set_4    | outcome_2       |

\`\`\``
};