---
type: plan
id: "2026-10-21-scaffold-nextjs-recipes-project"
title: "Scaffold the Next.js AI SDK Recipes Project Implementation Plan"
date: "2026-10-21T17:19:47+00:00"
author: "Xuemin Guan"
producer: create-plan
status: draft
tags: [scaffold, nextjs, ai-sdk, mise]
revision: "e11f35e381a34430809e05dfed535b1b5b327118"
repository: "vercel-ai-sdk-recipes-nextjs"
last_updated: "2026-10-21T18:00:00+00:00"
last_updated_by: "Xuemin Guan"
schema_version: 1
---

# Scaffold the Next.js AI SDK Recipes Project Implementation Plan

## Overview

Build the project that `project-setup.md` describes: one Next.js app, one
folder per recipe, and mise as the only entry point. The first recipe is
`call-tools-multiple-steps`. It calls OpenAI directly through
`@ai-sdk/openai`.

`project-setup.md` is already up to date. It includes the OpenAI provider,
the `mise precommit` gate borrowed from `chl-email-templates`, and every fix
from the model-panel review. **This plan builds what the doc says.** Where
this plan and the doc differ, the doc wins. Report the difference.

## Current State Analysis

- The repo holds only `project-setup.md` and this plan. It is already a
  jj-colocated repo (`.jj/` and `.git/` both exist), so skip
  `jj git init --colocate`.
- The working-copy change `e11f35e3` has no description yet.
- mise 2026.9.15 and jj are installed.
- Every pinned version in the doc exists (checked on 2026-10-21).

## Desired End State

- Every file in the doc's Layout exists, with the content from Steps 2 to 11.
- `mise precommit` passes, and passes again when run a second time.
- `mise run recipe call-tools-multiple-steps` opens the recipe. Asking
  *"What's the weather where I am?"* gives a `getLocation` call, then a
  `getWeather` call, then a text answer.
- jj does not track `.env.local`. It holds the real `OPENAI_API_KEY`.
- The history has three jj commits, one per phase. Each one passed
  `mise precommit` before it was made.

### Key Discoveries (all tested in a scratch copy of this scaffold)

- **mise:** task tables must be `[tasks.<name>]`. `output = "timed"` hides
  stdout, so the doc uses `timings = true`. `{ task = "…" }` runs steps in
  order. `lockfile = true` works without experimental mode. mise doesn't
  fail when `.env.local` is missing.
- **`bun init`** adds `@types/bun: "latest"`, `peerDependencies`
  (`typescript ^7`), `scripts` and `module`. It also creates `index.ts`,
  `README.md`, `.cursor/` and `CLAUDE.md`. It doesn't overwrite files that
  already exist.
- **Next** adds `allowJs` and `esModuleInterop` to `tsconfig.json` if they're
  missing, and rewrites the file's layout. The doc's tsconfig includes both,
  and Next then leaves it alone.
- **Next 16.4's `next dev`** writes `AGENTS.md` on every start.
- **`next typegen`** fails if there is no `app/` folder. So the tooling and
  the app shell go in one phase, and the full gate can pass before the
  first commit.
- **Without `-p`, `next dev`** moves to port 3001 when 3000 is busy. With
  `-p 3000`, it fails with `EADDRINUSE`.
- **TypeScript 7.0.2** works with `next typegen` and `tsc`, including the
  `noUnused*` flags.
- **Biome finds three errors in the recipe page:** `noArrayIndexKey` twice
  and `useIterableCallbackReturn` once. The suppression comments in doc Step 9
  clear all three. Biome also moves `@ai-sdk/openai` above `ai` in the route's
  imports.
- **Recipe source:** pinned at vercel/ai commit `a8961ebc49`, the last
  commit that changed the file (2026-09-23).

## What We're NOT Doing

- No Vercel AI Gateway.
- No second recipe, and no work in `vercel-ai-sdk-recipes-bun`.
- No `package.json` scripts, tests, CI or deployment.
- No recipe code changes beyond the doc's Step 9: the four provider and path
  lines, Biome's formatting and the three suppression comments.
- No `jj git push`. We commit locally only.

## Implementation Approach

Follow the doc from Step 1 to Step 11 in order, with these phase breaks:

| Phase | Doc steps | Ends with |
|---|---|---|
| 1. Tooling and app shell | 1–8, 11 | `mise precommit` passes; commit |
| 2. First recipe | 9 | `mise precommit` passes; commit |
| 3. Live check | 10 | manual check in the browser; commit if anything changed |

**How to run the server during checks.** Run `mise run dev` in the background
and send its output to a log file. Wait until `curl -sf localhost:3000/`
succeeds. Run the checks, then stop the server with
`pkill -f "next dev -p 3000"`. Before you start, check that the port is free
with `lsof -i :3000`.

**Rule for surprises.** If a step creates, changes or fails in a way that the
doc doesn't describe, stop and report it. Don't work around it.

---

## Phase 1: Tooling and App Shell

### Overview

Install the tools and dependencies, add all config files, the layout and the
home page, and the agent instructions.

### Changes Required:

Run the doc's steps exactly, in this order:

1. **Step 1:** check `mise --version` and `jj --version`.
2. **Step 3 first, for `.gitignore` only.** Write `.gitignore` before any jj
   command runs. Then write `.env.default`, and a `.env.local` that holds an
   empty `OPENAI_API_KEY=`. Skip `jj git init`, because the repo exists.
3. **Step 2:** write `mise.toml`, then run `mise trust`, `mise install` and
   `mise lock`.
4. **Step 4:** run `bun init -y` and the `rm` line. Run both `bun add`
   commands with the exact versions, then `bun remove @types/bun`. Edit
   `package.json`: remove `scripts`, `module` and `peerDependencies`, and
   keep `"private": true` and `"type": "module"`.
5. **Steps 5 to 8:** write `tsconfig.json`, `biome.jsonc`, `next.config.ts`,
   `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx` and
   `app/page.tsx`, each exactly as the doc shows.
6. **Run `mise run fix`, then `mise precommit`.**
7. **Start the server once** (see "How to run the server" above), so that
   Next writes `AGENTS.md`. Stop it.
8. **Step 11:** create `CLAUDE.md` with the doc's three lines.
9. **Run `mise precommit` again.**

### Success Criteria:

#### Automated Verification:

- [x] Tools are pinned: `mise exec -- node --version` prints `v24.22.1`, and
  `mise exec -- bun --version` prints `1.4.3`
- [x] `mise tasks ls` lists 8 tasks and shows no "unknown field" warning
- [x] The lockfile matches: `bun install --frozen-lockfile` succeeds
- [x] `package.json` has no `scripts`, `module` or `peerDependencies` field,
  no `@types/bun`, and no version with `^`
- [x] Every version in `package.json` matches the doc's Versions table
- [x] `index.ts`, `README.md` and `.cursor/` don't exist
- [x] `mise precommit` passes twice in a row, and `tsconfig.json` doesn't
  change between the runs
- [x] With the server running, `curl -s localhost:3000` contains
  `AI SDK Recipes`
- [x] `AGENTS.md` exists, and the first line of `CLAUDE.md` is `@AGENTS.md`
- [x] `jj status` lists `mise.lock`, `bun.lock` and `AGENTS.md`. It does not
  list `.env.local`, `node_modules/`, `.next/` or `next-env.d.ts`.

#### Manual Verification:

- [ ] Put the real `OPENAI_API_KEY` in `.env.local`

#### Commit:

`jj commit -m "Set up tooling, config and the recipe list home page"`. This
commit also holds `project-setup.md` and this plan.

---

## Phase 2: First Recipe, `call-tools-multiple-steps`

### Overview

Copy the recipe in, following the doc's Step 9.

### Changes Required:

#### 1. Copy the two files from the pinned source

Get the source at the pinned commit:

```bash
curl -sf https://raw.githubusercontent.com/vercel/ai/a8961ebc4920ae8a0850c8d50af3fca2eb2d375b/content/cookbook/01-next/72-call-tools-multiple-steps.mdx
```

- The `app/api/chat/route.ts` block goes to
  `app/call-tools-multiple-steps/api/route.ts`.
- The `app/page.tsx` block goes to `app/call-tools-multiple-steps/page.tsx`.

Save an untouched copy of both blocks in the scratchpad. The diff check below
uses them.

#### 2. Apply the doc's four line changes

- `route.ts`: add `import { openai } from '@ai-sdk/openai';`, and change the
  model line to `model: openai('gpt-6-astra'),`.
- `page.tsx`: change the import to `'./api/route'`, and the `api:` path to
  `'/call-tools-multiple-steps/api'`.

#### 3. Fix, then add the three suppressions

Run `mise run fix`. Then add the three `biome-ignore` comments exactly where
the doc's Step 9 shows them. If Biome reports any other error in recipe code,
or `tsc` fails, stop and report it. Don't change the code to silence it.

### Success Criteria:

#### Automated Verification:

- [ ] `mise precommit` passes
- [ ] **Diff check:** copy the untouched docs blocks into a scratch folder
  with this repo's `biome.jsonc`, and run `biome format --write` on them.
  Then diff each one against our file. The only differences allowed are:
  - the four changed lines
  - the moved import line, `@ai-sdk/openai`
  - the three `biome-ignore` lines
- [ ] With the server running:
  - `curl -s localhost:3000` contains `call-tools-multiple-steps`
  - `curl -s -o /dev/null -w '%{http_code}' localhost:3000/call-tools-multiple-steps`
    prints `200`

#### Commit:

`jj commit -m "Add call-tools-multiple-steps recipe using the OpenAI provider"`

---

## Phase 3: Live Check

### Overview

Prove the recipe works against OpenAI. The doc's Step 10 describes it.

### Steps

1. Check that `.env.local` holds the real key. If the server is running,
   restart it.
2. Run `mise run recipe call-tools-multiple-steps`.
3. Ask *"What's the weather where I am?"*.

### Success Criteria:

#### Automated Verification:

- [ ] `mise run recipe no-such-recipe` prints `No recipe named no-such-recipe`
  and exits with an error

#### Manual Verification:

- [ ] The browser opens `/call-tools-multiple-steps` once the server answers
- [ ] A `tool-getLocation` part appears, then a `tool-getWeather` part. Each
  part shows an `output` and no error.
- [ ] The final text says 24° and sunny, using the tool outputs
- [ ] `http://localhost:3000` lists `call-tools-multiple-steps` as a link

#### If the model name fails

If OpenAI rejects `gpt-6-astra`, stop and ask the user which model to use.
Then change only that string, note the change in the doc's Step 9, run
`mise precommit` and commit:
`jj commit -m "Use <model> for call-tools-multiple-steps"`.

---

## Testing Strategy

### Unit Tests:

- None. This is a learning scaffold with no logic of its own. The gate is
  `mise precommit`: Biome, then `next typegen` and `tsc`.

### Integration Tests:

- The `curl` checks in Phases 1 and 2 prove that routing works without a
  model call.

### Manual Testing Steps:

1. Put a real `OPENAI_API_KEY` in `.env.local`.
2. Run `mise run recipe call-tools-multiple-steps`. Ask about the weather, and
   check for two tool calls and then text.
3. Open `/` and follow the recipe link.

## Performance Considerations

None. The app runs locally for one user.

## Migration Notes

Not applicable. This is a new project.

## References

- Setup guide: `project-setup.md`
- Recipe page: https://ai-sdk.dev/resources/recipes/next/call-tools-multiple-steps
- Pinned recipe source: https://github.com/vercel/ai/blob/a8961ebc4920ae8a0850c8d50af3fca2eb2d375b/content/cookbook/01-next/72-call-tools-multiple-steps.mdx
- Panel reviews: `/tmp/panel-20261021-183056-codex.md`, `/tmp/panel-20261021-183056-claude.md`
- Quality gate source: `/Users/xueminguan/development/ebury/chl-email-templates/mise.toml`
