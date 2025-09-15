export const discoveryCommand: BerkeliumCommand = {
    name: 'idea',
    description: 'Discovery phase in BDD',
    prompt: `**Role**: You are a product requirements specialist and a BDD expert. Your task is to act as a facilitator in the "Discovery" phase by generating a detailed requirements document for a new software feature.

**Input**: $ARGUMENTS

**Task**:

1.  **Read and Understand Context**: Check for the existence of a \`./.berkelium/memory.md\` file. If it exists, read its contents to understand the current state of the application's architecture, including the database schema, existing API endpoints, and shared components. Use this information to inform your analysis.
2.  **Clarify & Expand**: Use the initial input to generate a series of probing questions to better understand the user's needs, motivations, and the scope of the feature. This mimics the "Three Amigos" collaboration.
3.  **Conduct Research**: Perform a web search to gather context, analyze similar features in the market, and identify potential best practices or pitfalls.
4.  **Define Core Components**: Based on the gathered information, articulate the core user stories and acceptance criteria. Identify key stakeholders and their goals.
5.  **Establish Boundaries & Constraints**: Define the technical and non-technical constraints, such as the required technology stack, security considerations, and any out-of-scope items.
6.  **Generate Feature branch**: Create a feature branch for and parse its output for $BRANCH_NAME. All file paths must be absolute.
7.  **Generate Requirements document**: Create a comprehensive Markdown document named \`./.berkelium/$BRANCH_NAME/requirements.md\` using the provided template. The document should be detailed, clear, and actionable for subsequent BDD stages.

**Output**:

  * A list of clarifying questions for the user to refine the requirements.
  * The final \`./.berkelium/$BRANCH_NAME/requirements.md\` document based on the provided template and the gathered information.

-----

### **Detailed \`./.berkelium/$BRANCH_NAME/requirements.md\` Template**

This template is designed to be comprehensive and structured, ensuring all critical aspects of the feature are captured. The use of Markdown headings and lists makes it easily readable for both humans and AI.

\`\`\`markdown
# 🚀 Feature Specification: [Feature Name]

## 📝 1. Overview & Business Case
* **Feature Name**: [Descriptive, concise name for the feature]
* **Goal**: What is the primary objective of this feature? What problem does it solve?
* **Business Value**: Why is this feature important? What business metrics will it impact (e.g., user engagement, revenue, retention)?

---

## 🎯 2. Target Audience & User Stories
* **Target User(s)**: Who will use this feature? Describe their role and motivation.
* **User Stories**:
    * As a [type of user], I want [goal/action] so that [reason/benefit].
    * As a [type of user], I want [goal/action] so that [reason/benefit].
    * [Add more user stories as needed]

---

## ✅ 3. Functional Requirements
* **Core Functionality**:
    * [List the key actions the user can perform with the feature.]
    * [Example: Users can create a new account with an email and password.]
* **Acceptance Criteria**:
    * **GIVEN** [initial context]
    * **WHEN** [an action is performed]
    * **THEN** [the expected outcome occurs]
    * [Add more GIVEN-WHEN-THEN clauses for each key functional requirement.]

---

## ⚙️ 4. Technical Specifications & Constraints
* **Technology Stack**:
    * **Backend**: [e.g., Python, Node.js]
    * **Frontend**: [e.g., React, Vue.js]
    * **Database**: [e.g., PostgreSQL, MongoDB]
* **Integration Points**:
    * [List any external APIs or services this feature will interact with.]
* **Security & Data Privacy**:
    * [Describe any specific security requirements, such as encryption, authentication protocols, or compliance standards (e.g., GDPR).]
* **Performance Expectations**:
    * [What are the expected response times or load handling capabilities?]

---

## ⛔ 5. Out of Scope
* **Items Not Included**:
    * [List any features, functionalities, or use cases that are explicitly **not** part of this project. This is crucial to prevent scope creep.]
    * [Example: Social media login integration is out of scope for the initial release.]

---

## 🖼️ 6. Mockups & Wireframes (if applicable)
[If mockups are available, this section can be used to describe them or link to them. A description of the user flow can be included here.]

---

## 🔄 7. Revision History
* **Version 1.0**: Initial draft based on user input.
* **Version 1.1**: Added clarifications based on user feedback.
\`\`\``
}