export const TASK_TEMPLATE =`## Task: [Descriptive task title]

### Feature

\`\`\`gherkin
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

\`\`\`

### Setup Task

\`\`\`
READ src/config/settings.py:
  - UNDERSTAND: Current configuration structure
  - FIND: Model configuration pattern
  - NOTE: Config uses pydantic BaseSettings

READ tests/test_models.py:
  - UNDERSTAND: Test pattern for models
  - FIND: Fixture setup approach
  - NOTE: Uses pytest-asyncio for async tests
\`\`\`

### Implementation Task

\`\`\`\`
UPDATE path/to/file:
  - FIND: MODEL_REGISTRY = {
  - ADD: "new-model": NewModelClass,
  - VALIDATE: python -c "from path/to/file import MODEL_REGISTRY; assert 'new-model' in MODEL_REGISTRY"
  - IF_FAIL: Check import statement for NewModelClass

CREATE path/to/file:
  - COPY_PATTERN: path/to/other/file
  - IMPLEMENT:
   - [Detailed description of what needs to be implemented based on codebase intelligence]
  - VALIDATE: uv run pytest path/to/file -v

UPDATE path/to/file:
  - FIND: app.include_router(
  - ADD_AFTER:
    \`\`\`python
    from .endpoints import new_model_router
    app.include_router(new_model_router, prefix="/api/v1")
    \`\`\`
  - VALIDATE: uv run pytest path/to/file -v
\`\`\`\`

## Common Task examples

### Add New Feature

\`\`\`
1. READ existing similar feature
2. CREATE new feature file (COPY pattern)
3. UPDATE registry/router to include
4. CREATE tests for feature
5. TEST all tests pass
6. FIX any linting/type issues
7. TEST integration works
\`\`\`

### Fix Bug

\`\`\`
1. CREATE failing test that reproduces bug
2. TEST confirm test fails
3. READ relevant code to understand
4. UPDATE code with fix
5. TEST confirm test now passes
6. TEST no other tests broken
7. UPDATE changelog
\`\`\`

### Refactor Code

\`\`\`
1. TEST current tests pass (baseline)
2. CREATE new structure (don't delete old yet)
3. UPDATE one usage to new structure
4. TEST still passes
5. UPDATE remaining usages incrementally
6. DELETE old structure
7. TEST full suite passes
\`\`\`

## Tips for Effective Tasks

- Use VALIDATE after every change
- Include IF_FAIL hints for common issues
- Reference specific line numbers or patterns
- Keep validation commands simple and fast
- Chain related tasks with clear dependencies
- Always include rollback/undo steps for risky changes`;