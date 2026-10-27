@AGENTS.md

# CLAUDE.md

## Project context

**Yonja** turns every clean-up on Uganda's National Cleaning Days into a verified, mapped record: residents report a waste spot, prove it was cleaned with before/after photos that Gemini checks, and division officers see the results live. Built for the Pre-DevFest Hackathon Kampala 2026.

**Stack**

- Framework: Next.js 16, App Router
- Language: TypeScript, strict
- UI: React 19, Tailwind CSS v4 through PostCSS
- Data: Firestore (client SDK, live `onSnapshot`), photos stored as compressed base64 docs
- AI: Gemini through Firebase AI Logic (`firebase/ai`), JSON output validated with zod
- Maps: Google Maps JS API via `@vis.gl/react-google-maps`
- Hosting: static export (`output: "export"`) on Firebase Hosting; `pnpm ship` builds and deploys
- Package manager: pnpm, pinned in `packageManager`

**Layout**

| Path | What lives there |
|---|---|
| `src/app/` | Routes, layouts and pages |
| `src/lib/` | Pure modules (geo, image, stats, status) and the Firebase clients |
| `src/lib/firebase/` | Public web config, app/Firestore/AI singletons, spot data access |
| `src/lib/ai/` | Gemini tasks; every one goes through `generateJson` with a zod schema |
| `src/components/` | Client components |
| `src/lib/env.ts` | `requireEnv`. Every environment variable goes through it |
| `next.config.ts` | Next config. Typed, and where `typedRoutes` and `typedEnv` are switched on |
| `eslint.config.ts` | ESLint flat config. TypeScript, loaded through `jiti` |
| `e2e/` | Playwright. Anything that renders or fetches belongs here |
| `**/__tests__/` | Jest. Pure modules only |
| `.claude/` | The Claude Code harness. See `.claude/README.md` |

## Environment

Never read `process.env` directly. Call `requireEnv` from `src/lib/env.ts`, so a missing variable
fails at the point of use with a message naming the variable and pointing at `.env.example`.

Add every new variable to `.env.example` in the same commit as the code that reads it. A variable
that only exists in someone's `.env.local` does not exist.

The Firebase web config and the Maps browser key are public and live in `src/lib/firebase/config.ts`.
There is no server, so there are no server-only secrets; never add one to this repo.

## TypeScript

`strict` is on, and so are the flags `strict` leaves out. The ones that change how you write code:

| Flag | What it costs you |
|---|---|
| `noUncheckedIndexedAccess` | `arr[0]` and `record[key]` come back `T \| undefined`. Narrow before use |
| `exactOptionalPropertyTypes` | `{ a?: string }` will not accept `{ a: undefined }`. Omit the key instead |
| `noPropertyAccessFromIndexSignature` | Index signatures need brackets: `process.env["CI"]`, never `process.env.CI` |
| `verbatimModuleSyntax` | Type-only imports must say `import type`. No exceptions |
| `noUnusedLocals`, `noUnusedParameters` | An unused binding fails the build. Prefix with `_` if it has to stay |
| `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride` | Every branch returns, every case breaks, every override is declared |

Biome's `useLiteralKeys` is off in `biome.json` because it is the exact inverse of
`noPropertyAccessFromIndexSignature`: it rewrites `process.env["CI"]` back to `process.env.CI`,
which the compiler then rejects. The compiler flag wins, so the lint rule goes. Do not switch it
back on without removing the compiler flag in the same commit.

`typedRoutes` generates route types into `.next/types`, so a bad `Link href` is a compile error.
`experimental.typedEnv` types the variables the dev server loaded. Both write into `.next/types`,
which a clean clone does not have, so `pnpm typecheck` runs `next typegen` first. That is why the
script is not a bare `tsc --noEmit`: without it, CI would typecheck a project whose route and env
types do not exist yet and pass for the wrong reason.

`next-env.d.ts` is generated and git-ignored, on Next's own instruction. Never edit it, and never
commit it back.

## The test split

This is the line that decides where a test goes:

- **Jest** covers pure modules. No DOM that matters, no network, no Firebase.
- **Playwright** covers anything that renders, fetches or runs on the server. It boots the real
  app, so it is the only place that can prove a Server Action actually runs. A `"use server"`
  module typechecks cleanly and still fails the first time a person presses submit.

Jest and Playwright both claim `*.spec.ts` by default. `jest.config.cjs` ignores `e2e/`
explicitly. Without that, Jest collects the Playwright suite, finds no browser, and reports a wall
of failures that look like the unit tests broke. **Name unit tests `*.test.ts`.**

## Before you push

```bash
pnpm verify
```

That chains lint, typecheck, Jest and Playwright. Do not push if any step fails. Keep the branch
buildable at every commit.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

Types: `feat`, `fix`, `style`, `refactor`, `test`, `chore`, `docs`, `perf`, `ci`, `revert`.

Subject line in imperative mood, lowercase, no trailing period, 72 characters at most. Breaking
changes take a `!` after the type or scope and a `BREAKING CHANGE:` footer.

Commit early and often. One logical change per commit, never unrelated changes bundled together.

## Branches

Never push to `main`. Everything goes through a PR, and `main` stays deployable.

```
<type>/<short-description>
```

CI runs on every PR and must be green before merge.

## What the harness adds

`.claude/` carries subagents, slash commands, skills, rules and hooks, vendored from
[everything-claude-code](https://github.com/devharunah/everything-claude-code). Read
`.claude/README.md` for what is there and what was changed from upstream.

**This file wins.** Where a vendored rule disagrees with anything above, the text here is the
answer. The vendored rules were written for a general audience and know nothing about this
project.
