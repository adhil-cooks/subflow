# Subflow

**Subscription Management Platform**

Subflow is a subscription management application designed to help businesses manage customers, products, subscription plans, billing, invoices and payments from one place.

## Project Overview

The platform provides a centralized workspace for managing the subscription lifecycle, tracking payments and monitoring business performance.

### Core Modules

- Dashboard and business overview
- Customer management
- Product and product variant management
- Subscription plan management
- Subscription lifecycle management
- Invoice generation and tracking
- Payment recording and tracking
- Reports and analytics
- User roles and access control

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | Tailwind CSS v4 |
| Components | shadcn/ui with Base UI |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Validation | Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Vercel |

## Project Structure

```text
subflow/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── docs/
├── tasks/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   │   └── ui/
│   └── lib/
├── .env.example
├── AGENTS.md
├── package.json
└── README.md
```

## Getting Started

### Requirements

- Node.js 25
- npm
- Git
- A Supabase project

### Installation

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd subflow
```

Install dependencies:

```bash
npm ci
```

Create a local environment file:

```bash
copy .env.example .env.local
```

Add the required Supabase credentials to `.env.local`.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See `.env.example` for the required variable names.

Never commit `.env.local` or expose service-role credentials and API secrets in client-side code.

## Development Guidelines

Before contributing:

1. Read `AGENTS.md`.
2. Read `docs/PROJECT.md`.
3. Read `docs/UI_GUIDELINES.md` before UI development.
4. Read `docs/GIT_WORKFLOW.md` before committing.
5. Read your assigned task file in `tasks/`.

## Team

| Member | Primary Responsibility |
|---|---|
| Adhil | Frontend integration and dashboard |
| Adharsh | Frontend feature development |
| Arrow | Backend foundation, database and authentication |
| Arjun | Subscription and billing features |

## Git Workflow

- Work on feature branches.
- Do not push directly to `main`.
- Use conventional commit messages.
- Open a Pull Request for every feature.
- Run lint and production build before requesting review.

See `docs/GIT_WORKFLOW.md`.

## Quality Checks

```bash
npm run lint
npm run build
npm audit --omit=dev
```

## Deployment

The application is intended to be deployed through Vercel. Configure the required environment variables in the Vercel project settings before deployment.

## Project Status

Initial project foundation and team development setup.

---

**Subflow — Subscription management, simplified.**