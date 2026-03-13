---
trigger: always_on
---

## Project Structure — React/Next.js (App Router)

### Feature-Driven Philosophy
Follow the universal rule defined in `project-structure.md`: **Context → Feature → Layer**.

Organize applications by business capabilities (features) rather than technical concerns (components, hooks, utils).

### The Feature Slice
A feature directory encapsulates all code related to a specific domain or capability. It exposes a public API (via `index.ts`) and keeps its internal implementation private.

```
src/features/questionnaire/
├── index.ts                # Public API (exports components, types, service instances)
├── components/             # UI Components specific to this feature
│   ├── Wizard.tsx
│   └── QuestionCard.tsx
├── service.ts              # Pure business logic and I/O orchestration
├── repository.ts           # I/O abstraction (database queries)
├── schema.ts               # Validation schemas (e.g., Zod)
├── types.ts                # TypeScript definitions
└── __tests__/              # Co-located unit and integration tests
```

### Next.js App Router Integration
The Next.js `src/app/` directory should **ONLY** act as a routing layer. It should contain minimal logic, delegating work to feature modules.

```
src/app/
├── (admin)/                # Route groups for layout sharing without affecting URL
│   └── dashboard/
│       └── page.tsx        # Thin wrapper calling feature components/services
├── api/                    
│   └── responses/
│       └── route.ts        # Thin wrapper calling feature services
├── page.tsx                # Home route (Server Component)
└── layout.tsx              # Root layout
```

**Rules for Routing:**
- `page.tsx`, `layout.tsx`, and `route.ts` are entry points.
- They must NEVER contain pure business logic (e.g., calculating scores).
- They must NEVER contain direct ORM or Database access (e.g., `prisma.findMany`). They must call a `Service` instance.
- They are responsible for retrieving data (Server Components), passing props, and handling HTTP lifecycles (Route Handlers/Server Actions).

### Shared Global Concerns
Code that spans multiple features or represents raw infrastructure belongs in `src/shared/` or `src/lib/`.

```
src/
├── shared/                 # Code used across all features
│   ├── components/         # Generic UI (Button, Modal, Typography)
│   ├── hooks/              # Generic hooks (useWindowSize, useMobile)
│   └── utils/              # Pure utility functions (formatting, math)
└── lib/                    # Infrastructure configuration
    ├── prisma.ts           # ORM initialization
    └── logger.ts           # Winston/Pino logger setup
```

### Server vs. Client Components Strategy
By default, components are Server Components. 

- Use **Server Components** for data fetching and direct backend resource access.
- Use **Client Components** (`'use client'`) only at the leaves of the tree when interactivity (state, effects, event listeners) is required.

### Testing Location
- **Unit and Integration Tests** live adjacent to the code they test within the feature directory (`__tests__` or `.spec.ts`).
- **End-to-End Tests** live in a top-level `/e2e` directory, as they cross feature boundaries.
