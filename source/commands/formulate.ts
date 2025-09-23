import { TASK_TEMPLATE } from "./templates/task-template.js";

export const formulateCommand: BerkeliumCommand = {
    name: 'formulate',
    description: 'Generate tasks',
    prompt: `**Important**: Run \`git branch --show-current\` from repo root and parse $BRANCH_NAME from the output. All paths must be absolute.

**Input**: The complete \`./.berkelium/$BRANCH_NAME/prd.md\` document from the previous stage.

## Analysis Process

1. **Scope Definition**
   - Identify all affected files
   - Map dependencies
   - Check for side effects
   - Note test coverage

2. **Pattern Research**
   - Find similar changes in history
   - Identify conventions to follow
   - Check for helper functions
   - Review test patterns

3. **User Clarification**
   - Confirm change scope
   - Verify acceptance criteria
   - Check deployment considerations
   - Identify blockers

## PRP Generation

1. Use this template as base and change the appropriate sections according to this project's needs: ${TASK_TEMPLATE}.
2. Breakdown the implementation in to manageable tasks and for each task, create a new task file using the template. Use the naming convention \`T[number]_[feature_name].md\` (e.g., \`T001_User_Authentication.md\`, \`T002_Password_Reset.md\`). This ensures a clear, ordered workflow for the execution stage. Save all task files to \`./.berkelium/$BRANCH_NAME/tasks/\`.

### Context Section

\`\`\`yaml
context:
  docs:
    - url: [API documentation]
      focus: [specific methods]

  patterns:
    - file: existing/example.py
      copy: [pattern to follow]

  gotchas:
    - issue: "Library requires X"
      fix: "Always do Y first"
\`\`\`

### Task Structure

\`\`\`
ACTION path/to/file:
  - OPERATION: [specific change]
  - VALIDATE: [test command]
  - IF_FAIL: [debug strategy]
  - ROLLBACK: [undo approach]
\`\`\`

### Task Sequencing

1. **Setup Tasks**: Prerequisites
2. **Core Changes**: Main modifications
3. **Integration**: Connect components
4. **Validation**: Comprehensive tests
5. **Cleanup**: Remove temp code

### Validation Strategy

- Unit test after each change
- Integration test after groups
- Performance check if relevant
- Security scan for sensitive areas

## User Interaction Points

1. **Task Review**
   - Confirm task breakdown
   - Validate sequencing
   - Check completeness

2. **Risk Assessment**
   - Review potential impacts
   - Confirm rollback approach
   - Set success criteria

## Critical Elements

- Include debug patterns
- Add performance checks
- Note security concerns
- Document assumptions

## Quality Checklist

- [ ] All changes identified
- [ ] Dependencies mapped
- [ ] Each task has validation
- [ ] Rollback steps included
- [ ] Debug strategies provided
- [ ] Performance impact noted
- [ ] Security checked
- [ ] No missing edge cases

Remember: Small, focused changes with immediate validation.`
};