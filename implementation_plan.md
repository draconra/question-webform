# IMSA Questionnaire App Plan

## Goal Description
Digitize the IMSA (Indonesian Medical Severity Assessment) questionnaire into a full-stack web application. The UI will be specifically optimized for seniors (Age 50+) and fully mobile-responsive.

**MVP Scope:** For Version 1, the system will exclusively feature the "IMSA Questionnaire" as a seeded template. The dynamic schema will exist under the hood, but the complex Admin Form Builder UI will be deferred to a later update.

## UI/UX Strategy for Seniors (Age 50+) & Mobile Responsiveness
To ensure a frictionless experience across all devices, particularly on mobile phones for users aged over 50:

1. **Mobile-First Wizard Layout:** The "One-Question-Per-Screen" style is inherently mobile-friendly. On a phone, the question and its options will dominate the screen, removing distractions.
2. **Typography & Contrast:** Minimum 18px body font size and 24px headings. High contrast ratios (WCAG AAA). 
3. **Large Touch Targets:** Oversized radio buttons and checkboxes (min 48x48px). On mobile, options will be styled as large, full-width tappable blocks rather than tiny circles.
4. **Clear Distinctions:** Bold active/focus states with thick borders and background colors.
5. **Sticky Navigation:** On mobile, the "Next" and "Previous" buttons will be sticky at the bottom of the viewport so they are always reachable by the user's thumb without scrolling.

## Proposed Architecture & Tech Stack
- **Framework:** Next.js (App Router) 
- **Database:** PostgreSQL/SQLite (via Prisma ORM). 
- **Styling:** Vanilla CSS / CSS Modules using a modern, accessible design system.
- **Authentication:** `NextAuth.js` (Auth.js) for Admin Dashboard access.

## Advanced Admin Dashboard Analytics 
1. **Calculated "Severity Scores" Overview**
2. **Dynamic Cross-Tabulation (Crosstabs)**
3. **Completion Rates & Drop-off Funnel**
4. **Data Health & Missing Value Indicators**
5. **Visual Answer Distributions**

## MVP Database Schema (Seeded Form Engine)
To allow future expansion while keeping MVP simple, we use a flexible schema but seed it automatically via a script:
1. **`FormTemplate`**: `id`, `title`, `description`, `createdAt`
2. **`Question`**: `id`, `formTemplateId`, `variable_name` (e.g., "pra_1_language_skill" for STATA), `type` (text, radio, checkbox, number), `prompt` (The actual question text), `options` (JSON array: `[{label: "Menikah", value: 1}]`), `orderIndex`, `required`
3. **`Response`**: `id`, `formTemplateId`, `createdAt`
4. **`Answer`**: `id`, `responseId`, `questionId`, `value` (Stores the numeric `value` selected for STATA)

## Data Export Mapping for STATA
- The backend will fetch the IMSA `FormTemplate`, determine all its `Question` records, and use their `variable_name` as the CSV headers.
- It will then iterate through all `Response` records, fetching their associated `Answer` rows, and placing the numeric `value` under the correct column header.
- This results in a mathematically-coded CSV download that is 100% interoperable with STATA.
