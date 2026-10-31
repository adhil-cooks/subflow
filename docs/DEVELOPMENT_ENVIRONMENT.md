# Subflow — Development Environment

## 1. Runtime

Current team local development choice: Node.js 25.

Use npm as the package manager.

Check your installed versions:

```bash
node -v
npm -v
```

Use the committed `package-lock.json` and install dependencies with:

```bash
npm ci
```

Do not independently upgrade packages or change the package manager.

## 2. Development Commands

Start the development server:

```bash
npm run dev
```

Run lint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Check production dependency vulnerabilities:

```bash
npm audit --omit=dev
```

## 3. Dependencies

- Keep dependencies consistent across the team.
- Do not use `npm audit fix --force`.
- Do not upgrade Next.js, React, Tailwind or shadcn without team approval.
- Keep `package-lock.json` committed.
- Install shadcn CLI as a development dependency.

## 4. Environment Variables

Create `.env.local` in the project root.

Use `.env.example` as the reference.

Never commit `.env.local`.

### Public variables

Only values safe for browser exposure may use the `NEXT_PUBLIC_` prefix.

### Server-only variables

Keep these private:
- Supabase service-role key.
- Gemini API key.
- Other privileged credentials.

Never import server-only secrets into client components.

## 5. Supabase Setup

The project uses Supabase for:
- PostgreSQL database.
- Authentication.
- Row Level Security.
- Application data access.

Each developer should use the agreed team Supabase project and coordinate schema changes with Arrow.

## 6. Vercel

The application is intended for Vercel deployment.

Before deployment:
- Verify the selected Node.js runtime is supported by Vercel.
- Configure environment variables.
- Ensure the production build succeeds.
- Never use local secrets in committed files.

The team's local Node.js version and Vercel's supported deployment runtime must be checked separately. Do not assume Node.js 25 is supported as a Vercel deployment runtime.

## 7. Troubleshooting

If dependencies are inconsistent:

```bash
npm ci
```

If the development server is already running, stop it before restarting after configuration changes.

If a build fails, inspect the first meaningful error before changing dependencies or configuration.

## 8. Team Rule

All developers must use the same committed dependency versions and lockfile. Discuss dependency changes before merging them.