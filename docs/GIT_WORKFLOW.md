# Subflow — Git and GitHub Workflow

## 1. Main Branch

`main` is the shared stable branch.

Never commit directly to `main`.

All development must happen through feature branches and Pull Requests.

## 2. Branch Naming

Use the following naming convention:

```text
feat/adhil-feature-name
feat/adharsh-feature-name
feat/arrow-feature-name
feat/arjun-feature-name
```

Examples:

```text
feat/adhil-dashboard
feat/adharsh-customer-ui
feat/arrow-supabase-schema
feat/arjun-invoice-generation
```

Use `fix/` for bug fixes and `docs/` for documentation-only changes.

## 3. Starting Work

Always update your local `main` first:

```bash
git switch main
git pull origin main
```

Create a feature branch:

```bash
git switch -c feat/your-name-feature
```

## 4. Commit Messages

Use conventional commit messages:

```text
type(scope): short description
```

Allowed types:

- `feat` — New feature
- `fix` — Bug fix
- `ui` — UI changes
- `refactor` — Code restructuring
- `test` — Tests
- `docs` — Documentation
- `chore` — Maintenance

Examples:

```bash
git commit -m "feat(dashboard): add summary cards"
git commit -m "ui(customers): create customer table"
git commit -m "feat(auth): add role validation"
git commit -m "fix(invoice): prevent duplicate invoices"
git commit -m "docs(project): update architecture"
```

## 5. Regular Commits

Each team member should push meaningful progress regularly, aiming for at least one meaningful commit per hour during active development.

Do not create empty commits or meaningless changes just to meet the target.

## 6. Push Your Branch

```bash
git add .
git commit -m "feat(scope): describe your change"
git push -u origin your-branch-name
```

Continue pushing new commits to the same feature branch.

## 7. Pull Requests

Open a Pull Request from your feature branch into `main`.

Every PR should include:
- Summary of changes.
- Related task checklist item.
- Tests performed.
- Screenshots for UI changes.
- Database or environment changes.
- Any integration notes.

## 8. Review and Merge

- Adhil coordinates frontend integration.
- Arrow reviews database, authentication and RLS changes.
- Arjun coordinates billing-related changes with Arrow.
- Relevant feature owners review their related changes.

Do not merge unreviewed changes that affect shared contracts or business logic.

## 9. Before Opening a PR

Run:

```bash
npm run lint
npm run build
```

Also test the changed feature manually.

## 10. After a PR Is Merged

Update your local main:

```bash
git switch main
git pull origin main
```

Create a new branch for the next task.

## Golden Rule

Keep PRs small, focused and easy to review. Coordinate before modifying another teammate's assigned files.