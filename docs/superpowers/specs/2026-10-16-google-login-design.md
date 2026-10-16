# Google Login Caregiver Design

## Goal

Add Google OAuth as an optional sign-in method for caregivers while keeping email/password caregiver login and anonymous elder sign-in unchanged.

## Scope

- Add a Google sign-in helper using the existing browser Supabase client.
- Add a clearly separated Google button to the caregiver authentication form.
- Redirect successful OAuth sign-in to `/caregiver/hubungkan` so a caregiver can immediately pair an elder.
- Enable Supabase URL-session detection needed to consume the OAuth callback.
- Keep the Google option unavailable in the no-Supabase simulation mode.
- Add focused tests for the OAuth helper contract and preserve the existing authentication tests.

## Flow

1. A caregiver opens the existing onboarding form and clicks “Lanjutkan dengan Google”.
2. The browser calls Supabase `signInWithOAuth({ provider: "google" })` with a redirect to the current origin plus `/caregiver/hubungkan`.
3. Google authenticates the caregiver and redirects back through Supabase to that URL.
4. The Supabase client detects the returned session; the existing `CaregiverSession` creates the `caregivers` row from Google metadata/email when needed.
5. The caregiver sees the existing pairing screen.

## Error handling

- OAuth initiation errors use the existing `errorMessage` mapping and appear in the same alert area as email errors.
- A provider that has not been enabled in Supabase will produce the existing user-facing Supabase error rather than silently falling back.
- The button is hidden when Supabase is not configured because Google OAuth cannot be simulated locally.

## Configuration outside the repository

- Enable Google under Supabase Authentication providers.
- Configure the Google OAuth client with the Supabase callback URL.
- Add local and Vercel caregiver pairing URLs to Supabase redirect allowlists.

