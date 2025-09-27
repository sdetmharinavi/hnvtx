Project Context
Project Type: app router Next js web app
Tech Stack: using tailwind css for styling, framer motion for animations, supabase for database, zustand for local stores, @tanstack/react-query for query etc.
Project Scale: Medium

I will paste my complete project structure with file paths and contents below. Please analyze this codebase comprehensively, understanding:

Architecture and design patterns used
Data flow and state management
Dependencies and integrations
Current functionality and features
Code organization and structure

Analysis Framework
Please evaluate the codebase across these dimensions:
1. Correctness & Stability (Priority 1)

Identify bugs, logic errors, and potential crash scenarios
Check for unhandled edge cases and error conditions
Validate data handling and type safety
Review async operations and race conditions
Assess error handling and recovery mechanisms

2. Performance & Reliability (Priority 2)

Identify performance bottlenecks and optimization opportunities
Review resource usage (memory, CPU, network)
Check for memory leaks and inefficient algorithms
Evaluate scalability constraints
Assess monitoring and logging adequacy

3. Code Quality & Maintainability (Priority 3)

Review code organization, naming conventions, and documentation
Identify code duplication and refactoring opportunities
Assess test coverage and testing strategy
Check dependency management and security vulnerabilities
Evaluate development workflow and tooling

4. User Experience & Features (Priority 4)

Identify UX pain points and improvement opportunities
Suggest realistic feature enhancements aligned with user needs
Review accessibility and responsiveness
Assess loading times and user feedback mechanisms

1. Make every effort to understand the existing functionality and features of the app, including any specific user flows or business logic that are critical to the application.Keep all things in your memory crystal clear for future discussions.Also remember that single source of truth for types will be schemas/zod-schemas.ts, which is used across the app for type safety and validation and which are being auto generated according to our supabase database through scripts utils/zod-validation.config.ts, scripts/generate-flattened-types.ts and scripts/generate-zod-schemas.ts. We will refactor all files to use types using schemas/zod-schemas.ts as a single source of truth. In schemas/zod-schemas.ts types always start with capital case letter and are used in the app for type safety and validation for example V_cable_segments_at_jcRowSchema. Schema starts with small letter for example v_cable_segments_at_jcRowSchema.

Response Format
For each issue found, please provide:

Category: [Correctness/Performance/Maintainability/UX]
Severity: [Critical/High/Medium/Low]
Location: [Specific file(s) and line numbers where applicable]
Description: [Clear explanation of the issue]
Impact: [How this affects users/developers/system]
Recommendation: [Specific, actionable solution]
Implementation Notes: [Any gotchas or considerations]
codes: relevant full codes

Ongoing Collaboration
After this initial analysis:

I may ask follow-up questions about specific issues
Request detailed implementation guidance for fixes
Seek clarification on trade-offs between different approaches
Ask for help prioritizing improvements based on impact vs. effort

Keep in mind what packages and their versions being used in this project through package.json and try to use the same packages for any new feature or component.

Please keep this analysis in context for our future discussions in this conversation. Below is the my existing project
