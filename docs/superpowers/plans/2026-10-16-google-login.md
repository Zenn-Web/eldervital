# Google Login Caregiver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth as an optional caregiver login path without changing anonymous elder sign-in or existing email/password login.

**Architecture:** Reuse the existing Supabase browser client and caregiver auth module. A small auth helper starts OAuth and redirects to the existing caregiver pairing route; the existing caregiver session guard handles profile creation after the callback. The authentication form owns loading/error presentation and keeps Google hidden in simulation mode.

**Tech Stack:** Next.js 16.4 App Router, React 19, TypeScript, Supabase JS 2, Vitest.

## Global Constraints

- Do not change anonymous elder authentication.
- Keep email/password caregiver login available.
- Do not add dependencies.
- Never add secrets or `.env.local` to the branch.
- Use the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` variables.

---

### Task 1: Add the OAuth contract test

**Files:**
- Create: `src/lib/auth/caregiver.test.ts`

**Interfaces:**
- Consumes: `signInCaregiverWithGoogle()` from `src/lib/auth/caregiver.ts`.
- Produces: A test that documents the Supabase provider and redirect contract.

- [ ] **Step 1: Write the failing test**

Create a Vitest test that stubs the existing Supabase client factory and browser origin, calls `signInCaregiverWithGoogle()`, and asserts `auth.signInWithOAuth` receives:

```ts
{
  provider: "google",
  options: { redirectTo: "https://app.example/caregiver/hubungkan" },
}
```

Also assert that a returned Supabase error is thrown.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/lib/auth/caregiver.test.ts`

Expected: FAIL because `signInCaregiverWithGoogle` does not exist.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/caregiver.test.ts
git commit -m "test: define caregiver Google OAuth contract"
```

### Task 2: Implement the Supabase OAuth helper and callback session handling

**Files:**
- Modify: `src/lib/auth/caregiver.ts`
- Modify: `src/lib/supabase/client.ts`
- Test: `src/lib/auth/caregiver.test.ts`

**Interfaces:**
- Consumes: `getSupabase("caregiver")` and `window.location.origin`.
- Produces: `signInCaregiverWithGoogle(): Promise<void>`.

- [ ] **Step 1: Implement the minimal helper**

Call `db().auth.signInWithOAuth` with provider `google` and redirect URL `${window.location.origin}/caregiver/hubungkan`; throw the returned error. Change `detectSessionInUrl` to `true` for the shared client so the OAuth callback can restore the session.

- [ ] **Step 2: Run the focused test to verify it passes**

Run: `npm test -- src/lib/auth/caregiver.test.ts`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/caregiver.ts src/lib/supabase/client.ts src/lib/auth/caregiver.test.ts
git commit -m "feat: add caregiver Google OAuth helper"
```

### Task 3: Add the caregiver UI path

**Files:**
- Modify: `src/modules/onboarding/components/CaregiverAuthForm.tsx`

**Interfaces:**
- Consumes: `signInCaregiverWithGoogle`, `isSupabaseConfigured`, existing `busy/error` state.
- Produces: An accessible Google sign-in button that starts OAuth and uses the existing error surface.

- [ ] **Step 1: Add the button and handler**

Add a handler that clears errors/info, sets `busy`, calls `signInCaregiverWithGoogle`, and leaves navigation to the OAuth redirect. Render the button only when `isSupabaseConfigured()` is true, with `type="button"`, disabled state, readable Indonesian text, and a separator from the email form. Keep the no-Supabase simulation path unchanged.

- [ ] **Step 2: Run focused and full tests**

Run: `npm test -- src/lib/auth/caregiver.test.ts`

Expected: PASS.

Run: `npm test`

Expected: Existing suite and the new OAuth test pass.

- [ ] **Step 3: Commit**

```bash
git add src/modules/onboarding/components/CaregiverAuthForm.tsx
git commit -m "feat: add Google login option for caregivers"
```

### Task 4: Verify the branch and prepare handoff

**Files:**
- Review: all files changed by the feature

- [ ] **Step 1: Run repository checks**

Run: `npm run check && npm run build`

Expected: lint, typecheck, tests, and production build exit with code 0.

- [ ] **Step 2: Inspect the diff and secret safety**

Run: `git diff origin/main...HEAD --stat`, `git diff origin/main...HEAD`, and `git status --short`.

Expected: Only the design/plan docs, caregiver auth helper/client, caregiver form, and focused test are changed; no `.env.local` or secret appears.

- [ ] **Step 3: Commit any remaining documentation if needed**

```bash
git add docs/superpowers/specs/2026-10-16-google-login-design.md docs/superpowers/plans/2026-10-16-google-login.md
git commit -m "docs: record Google login design and plan"
```

