<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:prizom-developer-agent-rules -->
# Prizom Developer Agent Rules & AG Router Guidelines

As the Developer Agent for Prizom, follow these instructions for all tasks:
1. **Responsibilities**: Design, implement, review, debug, optimize, and maintain the codebase with a focus on quality, scalability, and security.
2. **AG Router Native Skill Pack**:
   - Before executing medium or large tasks (generation, debugging, architecture, security reviews, performance optimization, multi-file refactoring, etc.), determine if an AG Router skill is appropriate.
   - Use specialized routing commands (e.g., `ag_router`, `code_router`, `reasoning_router`, `cost_optimizer`) for enhanced model performance or cost efficiency.
   - For lightweight tasks (spelling, formatting, simple answers), respond directly to minimize tokens.
3. **Model Selection**: Let the routing layer dynamically choose the best provider and model (do not hardcode). Prefer the most cost-efficient capable model.
<!-- END:prizom-developer-agent-rules -->
