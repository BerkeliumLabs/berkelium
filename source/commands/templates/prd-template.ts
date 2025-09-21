export const PRD_TEMPLATE = `\`\`\`markdown
## Problem Statement
[Clear articulation of the problem being solved]

## Solution Overview
[High-level description of proposed solution]

## Success Metrics
- Metric 1: [Measurable outcome]
- Metric 2: [Measurable outcome]
- KPI: [Key performance indicator]
\`\`\`

#### 2. User Stories & Scenarios
\`\`\`markdown
## Primary User Flow
\\\`\`\`mermaid
graph LR
    A[User Action] --> B{Decision Point}
    B -->|Path 1| C[Outcome 1]
    B -->|Path 2| D[Outcome 2]
    D --> E[Final State]
    C --> E
\\\`\`\`

## User Stories
1. **As a [user type]**, I want to [action] so that [benefit]
   - Acceptance Criteria:
     - [ ] Criterion 1
     - [ ] Criterion 2
   - Edge Cases:
     - [Edge case 1]
     - [Edge case 2]
\`\`\`

#### 3. System Architecture
\`\`\`markdown
## High-Level Architecture
\\\`\`\`mermaid
graph TB
    subgraph "Frontend"
        UI[User Interface]
        State[State Management]
    end
    
    subgraph "Backend"
        API[API Layer]
        BL[Business Logic]
        DB[(Database)]
    end
    
    subgraph "External"
        EXT[External Services]
    end
    
    UI --> API
    API --> BL
    BL --> DB
    BL --> EXT
    State --> UI
\\\`\`\`

## Component Breakdown
- **Frontend Components**:
  - [Component 1]: [Purpose]
  - [Component 2]: [Purpose]

- **Backend Services**:
  - [Service 1]: [Purpose]
  - [Service 2]: [Purpose]

- **Data Models**:
  - [Model 1]: [Fields and relationships]
  - [Model 2]: [Fields and relationships]
\`\`\`

#### 4. Technical Specifications
\`\`\`markdown
## API Design
\\\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant D as Database
    participant E as External Service
    
    U->>F: Initiates Action
    F->>A: POST /api/endpoint
    A->>D: Query Data
    D-->>A: Return Data
    A->>E: Call External API
    E-->>A: Response
    A-->>F: Processed Result
    F-->>U: Display Result
\\\`\`\`

## Endpoints
- **POST /api/[resource]**
  - Request: \`{field1: type, field2: type}\`
  - Response: \`{status: string, data: {...}}\`
  - Errors: \`400 Bad Request\`, \`401 Unauthorized\`

## Data Flow
\\\`\`\`mermaid
flowchart TD
    A[Input Data] --> B{Validation}
    B -->|Valid| C[Processing]
    B -->|Invalid| D[Error Response]
    C --> E[Transform]
    E --> F[Store]
    F --> G[Return Success]
\\\`\`\`

## Development Phases
\\\`\`\`mermaid
graph LR
    A[Foundation] --> B[Core Features]
    B --> C[Integration]
    C --> D[Testing]
    D --> E[Deployment]
    
    A -.- F[Database Schema<br/>API Framework<br/>Authentication]
    B -.- G[Business Logic<br/>API Endpoints<br/>Basic UI]
    C -.- H[External Services<br/>Full UI Integration<br/>Error Handling]
    D -.- I[Unit Tests<br/>Integration Tests<br/>Performance Tests]
    E -.- J[Documentation<br/>Monitoring<br/>Launch]
\\\`\`\`

#### Devil's Advocate Analysis
\`\`\`yaml
challenges:
  technical_risks:
    - risk: "Performance at scale"
      mitigation: "Implement caching layer"
    
    - risk: "Third-party API reliability"
      mitigation: "Build fallback mechanisms"
  
  business_risks:
    - risk: "User adoption"
      mitigation: "Phased rollout with feedback loops"
    
    - risk: "Scope creep"
      mitigation: "Strict MVP definition"
  
  edge_cases:
    - scenario: "No network connectivity"
      handling: "Offline mode with sync"
    
    - scenario: "Concurrent updates"
      handling: "Optimistic locking"
\`\`\`

#### Success Criteria
\`\`\`markdown
## Definition of Done
- [ ] All user stories implemented
- [ ] Test coverage > 80%
- [ ] Performance benchmarks met
- [ ] Security review passed
- [ ] Documentation complete

## Measurable Outcomes
- Metric 1: [Target value]
- Metric 2: [Target value]
- User satisfaction: [Target score]
\`\`\`

\`\`\``