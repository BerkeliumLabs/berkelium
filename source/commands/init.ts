const initCommand: BerkeliumCommand = {
	name: 'init',
	description: 'Generate project instructions for a given project scope',
	prompt: `Generate project instructions for project scope: $ARGUMENTS

Instructions should be saved to ./.berkelium/BERKELIUM.md file in markdown format.

Instructions should be generated according to the following template:

\`\`\`md
# 📋 [Project Name]
[Introduction for the project]

## 🚨 CRITICAL RULES
- Template-specific critical patterns
- Essential constraints and guidelines

## 🎯 PROJECT CONTEXT
- Project type and goals
- Technology stack
- Architecture decisions

## 🔧 DEVELOPMENT PATTERNS
- Coding standards and practices
- File organization
- Testing strategies

## 🐝 SWARM ORCHESTRATION (Optional)
- Agent coordination patterns
- Task distribution strategies
- Parallel execution rules

## 🧠 MEMORY MANAGEMENT
- Context storage patterns
- Decision tracking
- Knowledge persistence

## 🚀 DEPLOYMENT & CI/CD (Optional)
- Build processes
- Testing pipelines
- Deployment strategies

## 📊 MONITORING & ANALYTICS (Optional)
- Performance tracking
- Error monitoring
- User analytics

## 🔒 SECURITY & COMPLIANCE
- Security practices
- Compliance requirements
- Access controls
\`\`\``,
};

export default initCommand;