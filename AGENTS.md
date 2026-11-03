
# Screenline ATS — Engineering Instructions

You are assisting with an original, time-boxed
full-stack coding assignment.

## Stack
- Next.js App Router
- TypeScript with strict types
- Tailwind CSS
- shadcn/ui
- PostgreSQL and Drizzle in later phases

## Engineering principles
- Implement only the current requested milestone.
- Do not invent requirements or build future features.
- Prefer simple, maintainable implementations.
- Use strict TypeScript; avoid `any`.
- Favor small, reusable components.
- Use semantic HTML and accessible controls.
- Do not introduce dependencies without explaining why.
- Do not copy application source code from third-party projects.
- Never hardcode credentials or secrets.
- Never use real applicant personal information in demo data.

## UI principles
- Build an enterprise-quality recruiting application.
- Optimize for recruiters working with hundreds of applications.
- Prioritize information density, readability, and fast navigation.
- Use consistent spacing, typography, and status indicators.
- Avoid fake buttons or controls that appear functional.
- Make the interface responsive.

## Workflow
1. Inspect the existing code before changing anything.
2. Briefly describe the planned changes.
3. Implement only the requested scope.
4. Run linting and build checks.
5. Explain the files changed and any remaining issues.
6. Do not claim unimplemented features are working.

## Product principles
- Recruiter decisions remain human-controlled.
- Candidate ranking must be explainable.
- Do not use protected demographic attributes for ranking.
- Document major assumptions and tradeoffs.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
