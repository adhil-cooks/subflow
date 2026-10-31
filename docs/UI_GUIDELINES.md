# Subflow — UI Guidelines

## 1. Design Direction

Subflow should look like a professional SaaS application.

Design principles:
- Minimal and clean.
- Dark-first interface.
- Black, white and neutral grayscale.
- Clear information hierarchy.
- Consistent spacing and typography.
- Functional layouts without unnecessary decoration.

## 2. Avoid

- Excessive gradients.
- Glassmorphism.
- Neon colors and glowing effects.
- Decorative background blobs.
- Unnecessary animations.
- Oversized cards and headings.
- Inconsistent border radii.
- Excessive shadows.

## 3. Colors

Use neutral grayscale as the foundation.

- Page background: near-black.
- Sidebar and panels: dark neutral.
- Primary text: white or near-white.
- Secondary text: muted gray.
- Borders: subtle gray.
- Accent colors: reserved for meaningful actions and statuses.

Status colors should communicate meaning:
- Green: successful or paid.
- Yellow: pending or attention required.
- Red: overdue, failed or destructive.
- Gray: inactive or neutral.

Do not use color decoratively.

## 4. Layout

Use a consistent application shell:
- Sidebar navigation.
- Top header.
- Page title and description.
- Main content area.
- Consistent page padding.

Tables and data-heavy screens should prioritize readability and useful information density.

## 5. Components

Before creating a component, check:

1. `src/components/ui/`
2. `src/components/`
3. The relevant feature folder.

Reuse existing components wherever possible.

Do not create duplicate:
- Buttons
- Inputs
- Selects
- Dialogs
- Cards
- Tables
- Badges
- Dropdowns

Use shadcn/ui with the existing Base UI configuration.

## 6. Forms

- Use clear labels.
- Show validation messages near fields.
- Distinguish required fields.
- Disable submission when appropriate.
- Provide visible success and failure feedback.
- Avoid unnecessarily long forms.

## 7. Tables

- Use consistent column alignment.
- Provide useful empty states.
- Support loading states.
- Make important statuses easy to scan.
- Avoid unnecessary columns.
- Keep row actions predictable.

## 8. Responsive Design

All pages should work on:
- Desktop
- Tablet
- Mobile

Avoid horizontal overflow. Tables may use controlled horizontal scrolling when necessary.

## 9. Accessibility

- Use semantic HTML.
- Provide accessible labels.
- Maintain sufficient contrast.
- Support keyboard interaction.
- Do not communicate status using color alone.

## 10. Final Rule

Consistency is more important than introducing a new visual style for every page. Reuse the same design language and shared components throughout Subflow.