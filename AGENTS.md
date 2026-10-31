<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


<!-- BEGIN: SUBFLOW PROJECT RULES -->

# Subflow — Project Development Rules

## 1. Before Development
- Read `docs/PROJECT.md` to understand the project architecture.
- Read `docs/DEVELOPMENT_ENVIRONMENT.md` for runtime and dependency rules.
- Read `docs/UI_GUIDELINES.md` before creating or modifying UI.
- Read `docs/GIT_WORKFLOW.md` before committing or opening PRs.
- Read your assigned task file inside `tasks/`.

## 2. Technology Stack
- Next.js 16.4.3 with App Router.
- React 19 and TypeScript.
- Tailwind CSS v4.
- shadcn/ui with Base UI.
- Supabase for database and authentication.
- Zod for validation.
- Recharts for dashboard visualizations.
- Lucide React for icons.
- Vercel for deployment.

Do not change the stack or upgrade dependencies without team approval.

## 3. UI Development Rules
- Use a minimal, professional black-and-white dark-first design.
- Avoid excessive gradients, animations, shadows and decorative elements.
- Reuse existing components before creating new ones.
- Check `src/components/ui/`, `src/components/` and relevant feature folders.
- Keep shared components reusable and consistent.
- Do not duplicate buttons, inputs, tables, dialogs, cards or badges.

## 4. Code Quality
- Use TypeScript.
- Avoid `any` unless absolutely necessary.
- Keep components focused and reasonably small.
- Separate UI, business logic and database operations.
- Validate external inputs using Zod.
- Never expose secrets in client-side code.
- Never commit `.env.local`.

## 5. Git Rules
- Never commit directly to `main`.
- Create a feature branch for each task.
- Use conventional commit messages.
- Open PRs into `main`.
- Keep PRs focused and reviewable.
- Run lint and build before requesting review.

## 6. Team Coordination
- Follow the ownership defined in `tasks/`.
- Coordinate before modifying another member's assigned files.
- Reuse shared components instead of creating competing implementations.
- Ask the relevant owner before changing shared architecture or database contracts.

## 7. Next.js Documentation
- Before using an unfamiliar Next.js API, read the matching documentation in `node_modules/next/dist/docs/`.
- Follow the installed Next.js version's APIs and conventions, not outdated examples.

<!-- END: SUBFLOW PROJECT RULES -->
