---
trigger: model_decision
---

## React & Next.js Idioms and Patterns

This file governs idiomatic practices for React and Next.js (App Router).

### 1. Component State & Side Effects
- **Client Components:** Use `'use client'` strictly for interactivity. Do not default to client components.
- **Data Fetching:** Fetch data on the Server securely. Pass data down as primitives.
- **Purity:** React components should be pure functions of their props and state whenever possible.

### 2. Server Actions vs API Routes
- Favor **Server Actions** (`'use server'`) for simple UI-driven mutations and form submissions within React contexts.
- Use **Route Handlers** (`src/app/api/...`) for integrations, webhooks, or endpoints accessed outside of the React ecosystem (e.g., native mobile apps, external platforms).

### 3. Zod & Type Safety
Ensure robust data validation at system boundaries (forms, API routes) using a schema-validation library like Zod. This validates inputs before they ever reach the repository.

```typescript
// Define schema
const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

// Infer type for usage
type UserInput = z.infer<typeof UserSchema>;
```

### 4. Dependency Injection via Props & Context
- Pass dependencies and data explicitly via props for improved testability.
- Utilize React Context (`createContext`) only for global concerns like Theme, User Session, or critical application state, avoiding "prop drilling" where applicable.

### 5. Suspense & Streaming
Take advantage of `<Suspense>` boundaries to unblock HTML rendering and stream data.
```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DataHeavyComponent />
    </Suspense>
  )
}
```

### 6. Testability (Mocking Server Concerns)
When unit-testing UI, Server Actions and Database logic must be mocked using `jest.mock` or `vi.mock()`. Never execute real database calls directly from UI test files.
