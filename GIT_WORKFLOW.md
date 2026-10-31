# Git Workflow & Team Collaboration Guide

## Branching Strategy
- Main branch: `main`
- Feature branch prefix per developer:
  - Arrow (Database/Core): `feat/arrow-<feature>`
  - Arjun (Subscription/Billing): `feat/arjun-<feature>`
  - Adharsh (Invoices/Payment Frontend): `feat/adharsh-<feature>`
  - Adhil (Dashboard/UI): `feat/adhil-<feature>`

## Development Lifecycle
1. Branch from `main` using your assigned developer prefix.
2. Coordinate shared schema contracts and API surfaces before writing code.
3. Validate all business logic and edge cases with automated tests.
4. Keep commit messages concise, descriptive, and prefixed with domain scope.
5. Review schema changes with Arrow before merging.
6. Verify end-to-end flows before presenting to the team.
