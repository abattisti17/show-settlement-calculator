# Cursor / LLM: Read this first (project context + guardrails)

## Project status (current reality)
- App: Next.js (App Router).
- Backend: Supabase (hosted). RLS is ON.
- Auth: email/password .
- Current priority: keep system stable; no big refactors.

## Non-negotiable guardrails
- DO NOT do “architecture upgrades,” “cleanups,” or folder reshuffles unless asked.
- DO NOT rename tables/columns/endpoints unless asked.
- DO NOT touch Supabase config/RLS assumptions casually. If schema changes are needed, describe them explicitly.
- DO NOT introduce new libraries (state mgmt, ORMs, validators, etc.) unless there is a specific bug requiring it.
- Prefer smallest possible diff. Preserve working flows.

## How the app connects to Supabase
- Supabase URL is in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
- Supabase anon key is in `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Never commit real keys. `.env.example` contains placeholders only.

## Data + RLS assumptions (must remain true)
- Writes require authenticated user due to RLS.
- Any write path must use the authenticated client/session.
- If something fails with RLS, fix policies or ownership logic — don’t bypass with admin keys.

## Current known risks / landmines
- Accidental refactors break things more than they help.
- New code should be additive and local.
- If you must refactor, explain WHY and provide a rollback plan.

## Before you make changes
- Summarize what you’re about to change in 3 bullets.
- Keep changes minimal and scoped.
- Prefer editing existing patterns over introducing new ones.

## After you make changes (definition of done)
- Typecheck / build passes.
- Core user flows still work (login, basic CRUD).
- No changes to Supabase env wiring unless explicitly requested.

## Project history (running log — required)
We keep an append-only decision + progress log in `Project_History.md`.

Rules:
- **After any meaningful change**, append a new entry to `Project_History.md`.
- Entries must be **append-only** (do not rewrite or “clean up” old entries).
- Keep each entry short and factual: what changed, why, and how to undo it.

Entry format (copy/paste):

---
### YYYY-MM-DD — <short title>
**Context:** (1–2 sentences on what prompted the change)
**Decision:** (what we chose to do)
**Changes:** (bullets of what was modified; include file paths)
**Supabase impact:** (schema/RLS/env changes, or “none”)
**Tradeoffs:** (1–2 bullets)
**Rollback:** (how to revert; git command or steps)
**Next:** (optional — what to do next)
---