# Vercel AI SDK Recipes: Next.js

## Purpose

This is a learning project. We work through the official AI SDK recipes at
<https://ai-sdk.dev/resources/recipes>, one at a time, to get hands-on with
the Vercel AI SDK: text generation, tool calling, multi-step agents,
structured output and streaming chat UIs.

Each recipe gets built twice:

- **Here**, in `vercel-ai-sdk-recipes-nextjs`, the way the docs show it, with
  Next.js. We change the recipe code as little as possible.
- **In the sibling repo**, `vercel-ai-sdk-recipes-bun`, rebuilt with Bun and no
  framework. Rebuilding it by hand shows what Next.js was doing for us.

Comparing the two versions of the same recipe is the point. This is not a
product. Keep it simple, readable and easy to run. Don't build for scale,
reuse or production.

## The idea

One Next.js app. One folder per recipe. One command to run any recipe.

- Next.js is both the frontend and the backend. A single `next dev` process
  serves every recipe's page and every recipe's API.
- Each recipe lives in its own folder under `app/`. The folder holds the
  recipe's page and its backend route, side by side.
- The home page lists every recipe folder it finds. Add a folder and it
  appears on the list. There is no list to edit by hand.
- `mise` runs everything. `mise run recipe <name>` starts the app and opens
  that recipe in the browser.

## Layout

```
vercel-ai-sdk-recipes-nextjs/
├─ project-setup.md         # this file
├─ mise.toml                # tool versions, env loading, every command
├─ mise.lock                # committed: exact tool downloads and checksums
├─ CLAUDE.md                # tells coding agents to run `mise precommit`; imports AGENTS.md
├─ AGENTS.md                # written by `next dev`; committed as is
├─ .env.default             # committed: names the env vars, no secret values
├─ .env.local               # NOT committed: your real keys
├─ .gitignore
├─ package.json             # dependencies only, no scripts (mise is the entry point)
├─ bun.lock                 # committed: exact package versions
├─ tsconfig.json
├─ biome.jsonc              # formatter + linter
├─ next.config.ts
├─ postcss.config.mjs       # Tailwind
├─ meta/                    # plans and notes about this project
└─ app/
   ├─ layout.tsx            # the HTML shell shared by every page
   ├─ globals.css           # Tailwind
   ├─ page.tsx              # home page: lists every recipe folder
   └─ call-tools-multiple-steps/        # one recipe = one folder
      ├─ page.tsx           # the recipe's UI    → GET  /call-tools-multiple-steps
      └─ api/route.ts       # the recipe's API   → POST /call-tools-multiple-steps/api
```

### How a request finds its code

Next.js routes by folder path, so there is no central router or dispatcher:

```
                 ┌──────────── one process: next dev (localhost:3000) ────────────┐
 browser         │                                                                │
 GET  /call-tools-multiple-steps     → app/call-tools-multiple-steps/page.tsx     │
 POST /call-tools-multiple-steps/api → app/call-tools-multiple-steps/api/route.ts ┼─▶ OpenAI
 GET  /                              → app/page.tsx (the list)                    │
                 └────────────────────────────────────────────────────────────────┘
```

A `route.ts` file exports a function named after an HTTP method, such as
`export async function POST(req: Request)`. It takes a web-standard `Request`
and returns a `Response`. That is the whole backend for a recipe.

## Tooling

| Tool | Role | Notes |
|---|---|---|
| **mise** | Pins tool versions, loads `.env` files, runs every command | Install it yourself |
| **jj** (Jujutsu) | Version control, in a repo shared with git | Install it yourself |
| **Bun** | Installs packages and launches commands (`bun install`, `bun run …`) | Pinned by mise |
| **Node.js** | Runs the Next.js server | Pinned by mise to the current LTS. Next and the AI SDK officially test on Node, so the server runs there, not on Bun |
| **Next.js** (App Router) | Frontend and backend in one app | Dev server on port 3000 |
| **AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`) | `streamText`, `tool()`, `useChat` and friends; the OpenAI provider | What we're learning |
| **Zod** | Schemas for tool inputs and structured output | The AI SDK expects it |
| **Tailwind CSS** | Styling | The recipes use utility classes like `border` |
| **TypeScript 7** | Strict mode | The native (Go) compiler. Next 16.3+ type-checks with it by default |
| **Biome** | Formatting and linting | One tool instead of ESLint + Prettier, with its Next and React rule sets on |

The `recipe` task opens the browser with `open`, so it works on macOS only.
On Linux, use `xdg-open` instead.

### Where the model calls go: OpenAI

We call OpenAI directly, with an OpenAI API key. We chose this instead of the
Vercel AI Gateway.

The recipes name models as plain strings, for example
`model: 'openai/gpt-6-astra'`. In the AI SDK, a plain string goes to the
gateway. So each recipe changes that one line to use the OpenAI provider:

```ts
import { openai } from '@ai-sdk/openai';
// ...
model: openai('gpt-6-astra'),
```

You need one key, `OPENAI_API_KEY`, from platform.openai.com → API keys. The
provider reads it from the environment.

The Bun repo must use the same provider, so that the two versions of each
recipe stay comparable.

The other choice is the gateway: keep the docs' model strings and set
`AI_GATEWAY_API_KEY` from a Vercel account.

### Environment files

These are plain `NAME=value` text files. They are a common convention, not
something mise invented.

| File | Committed? | Holds |
|---|---|---|
| `.env.default` | Yes | Every variable's name, with an empty or safe value |
| `.env.local` | No | Your real secrets |

Two tools read them:

- **mise** loads both files, in that order, into every `mise run …`
  command. A value in `.env.local` wins over the same name in `.env.default`.
  If `.env.local` is missing, mise skips it.
- **Next.js** reads `.env.local` on its own and exposes the values to
  server code as `process.env.NAME`.

Both read the files only at start. **After you edit `.env.local`, stop the
server and start it again.** Next never replaces a variable that is already
set, and mise has already set it from the old file.

### Versions

The recipes use the newest AI SDK APIs (for example `isStepCount` and
`toUIMessageStream`). Install these versions, or the recipes won't compile.
These are the latest stable releases, checked on 2026-10-21:

| Tool or package | Version | Notes |
|---|---|---|
| Node.js | 24.22.1 | Current LTS ("Krypton"). Node 26 is newer but not LTS yet |
| Bun | 1.4.3 | |
| `next` | 16.4.2 | Needs Node ≥ 20.9 |
| `react`, `react-dom` | 19.3.1 | |
| `ai` | 7.0.148 | Needs Node ≥ 22 |
| `@ai-sdk/react` | 4.0.152 | |
| `@ai-sdk/openai` | 4.0.99 | Uses the same `@ai-sdk/provider` (4.0.31) as `ai` |
| `zod` | 4.6.7 | `ai` accepts Zod 3.25+ or 4.1+ |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 | |
| `@biomejs/biome` | 2.6.2 | |
| `typescript` | 7.0.2 | |
| `@types/react`, `@types/react-dom` | 19.3.0 | |
| `@types/node` | 24.19.2 | Matches the Node major we run, not the newest (26.x) |

When a recipe and the docs disagree with what's installed, trust what's
installed, then check the docs for that version.

### About TypeScript 7

TypeScript 7 is the native rewrite of the compiler: the same language, much
faster checking. Next.js 16.3 and later run the project's own `tsc` for type
checking by default, so TypeScript 7 works with no extra config. We checked
that `next typegen` and `tsc` both pass with it. Two things behave
differently:

- Type errors print as plain `tsc` output. Next doesn't add its own error
  frames for pages and routes.
- TypeScript 7 doesn't include the JavaScript compiler API. The `next`
  editor plugin in `tsconfig.json` is built on that API, so its extra editor
  hints (such as warnings about `'use client'` misuse) may not appear.
  Builds and `mise run typecheck` are not affected.

If you want those editor hints back, install `typescript@5` instead. Nothing
else in this guide changes.

## Setup recipe

Follow these steps in order, starting from an empty folder. Each step says
what it does and why.

### Step 1: Install mise and jj

Check both:

```bash
mise --version
jj --version
```

If either fails, install it: mise from <https://mise.jdx.dev>, jj from
<https://jj-vcs.github.io/jj/>. mise installs everything else. Any recent
version of either works. When this was written, the newest mise was
2026.10.15.

### Step 2: `mise.toml`

This pins the tools, loads the env files and defines every command.

```toml
# Committed defaults first, then your gitignored secrets.
[env]
_.file = [".env.default", ".env.local"]

# Bun installs and launches; Node runs the Next server.
[tools]
node = "24.22.1"
bun = "1.4.3"

# Write mise.lock, so every machine downloads the same tool builds.
[settings]
lockfile = true

# Print how long each task took, and keep all of its output.
[settings.task]
timings = true

# -- Dependencies -------------------------------------------------------------

[tasks."deps:install"]
description = "Install dependencies"
run = "bun install"

# -- Run ----------------------------------------------------------------------

[tasks.dev]
description = "Start the app on port 3000; the home page lists every recipe"
depends = ["deps:install"]
run = "bun run next dev -p 3000"

[tasks.recipe]
description = "Start the app and open one recipe in the browser (macOS)"
depends = ["deps:install"]
usage = 'arg "<name>" help="A recipe folder under app/"'
run = '''
if [ ! -d "app/${usage_name}" ]; then echo "No recipe named ${usage_name}" >&2; exit 1; fi
(
  for _ in $(seq 60); do
    if curl -sf -o /dev/null http://localhost:3000/; then
      open "http://localhost:3000/${usage_name}"
      exit 0
    fi
    sleep 1
  done
  echo "The server did not answer on port 3000 within 60 seconds" >&2
) &
exec bun run next dev -p 3000
'''

# -- Code quality -------------------------------------------------------------

[tasks.precommit]
description = "Fix what can be fixed, then run every check. Run before each commit."
depends = ["deps:install"]
run = [{ task = "fix" }, { task = "check" }]

[tasks.fix]
description = "Format, sort imports and apply safe lint fixes"
depends = ["deps:install"]
run = "bun run biome check --write ."

[tasks.check]
description = "Run every check; never edits source files"
depends = ["deps:install"]
run = [{ task = "lint" }, { task = "typecheck" }]

[tasks.lint]
description = "Check formatting and lint with Biome"
depends = ["deps:install"]
run = "bun run biome check ."

[tasks.typecheck]
description = "Generate Next's route types, then type-check"
depends = ["deps:install"]
run = ["bun run next typegen", "bun run tsc --noEmit"]
```

Some notes on this file:

- **Tasks go under `[tasks.<name>]`.** mise ignores a task table at the top
  level, such as `[dev]`, with an "unknown field" warning.
- **`timings = true`, not `output = "timed"`.** The `timed` output mode hides
  a task's normal output. That would hide `tsc` errors, which print there.
- **`-p 3000` makes a busy port fail loudly.** Without it, Next quietly moves
  to port 3001 when 3000 is taken. The browser would then open a different
  server, or nothing.
- **`recipe` waits for the server.** It opens the browser only once
  `localhost:3000` answers.
- **`{ task = "…" }` runs another task in the same mise process.** The steps
  run in order. This is lighter than calling `mise run` again for each step.

The quality tasks split into two kinds:

- **`fix`** changes files. It formats code, sorts imports and applies safe
  lint fixes.
- **`check`** never edits source files. It fails if anything is wrong. This
  is the command a CI job would run. It does write generated files that git
  ignores: `next-env.d.ts`, route types under `.next/` and `tsconfig.tsbuildinfo`.
  Like every task, it also runs `bun install` first.

`precommit` runs `fix`, then `check`. So the check sees code that is already
fixed, and it fails only on problems you must fix by hand.

There are no tests yet, because the recipes have no logic of their own. When
a recipe gets tests, add a `test` task that runs `bun test`, and add it to
`check`.

Then install the tools and write the lockfile:

```bash
mise trust
mise install
mise lock
```

Commit `mise.lock`. Run `mise lock` again whenever you change a version in
`[tools]`.

### Step 3: Version control and env files

`.gitignore`:

```gitignore
node_modules/
.next/
next-env.d.ts
*.tsbuildinfo
bun-debug.log*
.env.local
.env.*.local
mise.local.toml
.DS_Store
.idea/
.vscode/
```

`.env.default` (committed):

```bash
# From platform.openai.com → API keys. Put the real value in .env.local, not here.
OPENAI_API_KEY=
```

`.env.local` (not committed):

```bash
OPENAI_API_KEY=<your key>
```

Create the repo with jj, sharing it with git:

```bash
jj git init --colocate
```

jj tracks every file that `.gitignore` doesn't exclude. It does this each
time you run a jj command. So write `.gitignore` before you run any jj
command. If jj tracks a file by mistake, add it to `.gitignore`, then run
`jj file untrack <path>`.

### Step 4: Dependencies

`bun init` creates `package.json`. It skips files that already exist, so it
leaves your `.gitignore` alone. It also creates files we don't use: delete
them.

```bash
bun init -y
rm -rf index.ts README.md .cursor CLAUDE.md
```

`bun init` also writes a `tsconfig.json`. Step 5 replaces it. We write our
own `CLAUDE.md` in Step 11.

Then open `package.json` and:

- remove the `scripts`, `module` and `peerDependencies` fields that `bun init`
  added (mise runs everything, and `peerDependencies` holds a `^` range)
- keep `"private": true` and `"type": "module"`

Do this before you install anything. `bun init` lists `typescript` under
`peerDependencies`. If it is still there, `bun add --dev typescript@…`
updates that entry and doesn't add TypeScript to `devDependencies`.

Next, install the exact versions from the Versions table. Name each version.
A bare `bun add --exact next` would pin whatever is newest that day, not the
version in the table.

```bash
bun add --exact next@16.4.2 react@19.3.1 react-dom@19.3.1 ai@7.0.148 \
  @ai-sdk/react@4.0.152 @ai-sdk/openai@4.0.99 zod@4.6.7
bun add --exact --dev typescript@7.0.2 @types/react@19.3.0 @types/react-dom@19.3.0 \
  @types/node@24.19.2 @biomejs/biome@2.6.2 tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3
bun remove @types/bun
```

We remove `@types/bun` because the server runs on Node. Bun's types would let
code use Bun-only globals that fail at run time.

Commit `bun.lock`. To check that an install matches it exactly, run:

```bash
bun install --frozen-lockfile
```

### Step 5: TypeScript

`tsconfig.json` starts from the one `create-next-app` 16.4.2 writes, then
adds a few strict checks that catch mistakes early.

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "incremental": true,

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.mts",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

Compared with Next's template, we:

- raise `target` to ES2022, because there's no old browser to support
- add `noUnusedLocals` and `noUnusedParameters`, so leftovers from editing a
  recipe fail the check. If a recipe really needs an unused parameter, start
  its name with `_`.

Keep `allowJs` and `esModuleInterop`, even though everything here is
TypeScript. Next adds them back on its first run if they're missing:
`esModuleInterop` is required by its compiler, and `allowJs` is a default it
always suggests. Next also rewrites the whole file's layout when it does
this. The next `mise run lint` would then fail on formatting. With both keys
present, Next leaves the file alone.

Two strict flags we deliberately leave off, because they make learning noisy:

- `exactOptionalPropertyTypes` fights the AI SDK's option types.
- `noPropertyAccessFromIndexSignature` forces `process.env["X"]` instead of
  `process.env.X`.

### Step 6: Biome

`biome.jsonc`:

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.6.2/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "ignoreUnknown": true,
    "includes": ["**", "!**/node_modules", "!**/.next", "!next-env.d.ts", "!**/*.md"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  },
  "linter": {
    "enabled": true,
    "rules": { "preset": "recommended" },
    "domains": { "next": "recommended", "react": "recommended" }
  },
  "assist": {
    "actions": { "source": { "organizeImports": "on" } }
  }
}
```

- `preset` is the current way to pick the rule set. The older
  `"recommended": true` still works but is deprecated in Biome 2.6.
- `domains` turns on Biome's Next.js and React rules, as `create-next-app`
  does. That covers what ESLint's Next config would check.
- `organizeImports` sorts imports when you run `mise run fix` or `mise precommit`.
- `"!**/*.md"` keeps Biome away from Markdown. Biome 2.6 formats Markdown
  files too. It pads tables, removes blank lines before lists, and reformats
  code examples inside them, which broke the JSX example in Step 9.
- `"vcs": { "clientKind": "git" }` works with jj too, because the repo is
  shared with git and uses the same `.gitignore`.

Match the `$schema` version to the Biome version you installed.

### Step 7: Next.js and Tailwind

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

`postcss.config.mjs`:

```js
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};

export default config;
```

`app/globals.css`:

```css
@import "tailwindcss";
```

`app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = { title: "AI SDK Recipes" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="mx-auto max-w-2xl p-6 font-sans">{children}</body>
    </html>
  );
}
```

### Step 8: The home page

`app/page.tsx` is a server component. It runs on the server, so it can read
the `app/` folder and link to every recipe folder it finds.

```tsx
import { readdirSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";

function recipeNames(): string[] {
  return readdirSync(join(process.cwd(), "app"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("_") && !name.startsWith("("))
    .sort();
}

export default function Home() {
  return (
    <main>
      <h1 className="mb-4 text-2xl font-bold">AI SDK Recipes</h1>
      <ul className="list-disc pl-6">
        {recipeNames().map((name) => (
          <li key={name}>
            <Link className="underline" href={`/${name}`}>
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Folders starting with `_` or `(` are skipped. Next uses those for private
folders and route groups, so they are never recipes.

### Step 9: The first recipe

Source: <https://ai-sdk.dev/resources/recipes/next/call-tools-multiple-steps>

Pinned source, as copied:
<https://github.com/vercel/ai/blob/a8961ebc4920ae8a0850c8d50af3fca2eb2d375b/content/cookbook/01-next/72-call-tools-multiple-steps.mdx>

Copy the recipe's two files into a folder named after the recipe's URL slug:

| Docs file | Our file |
|---|---|
| `app/api/chat/route.ts` | `app/call-tools-multiple-steps/api/route.ts` |
| `app/page.tsx` | `app/call-tools-multiple-steps/page.tsx` |

In `route.ts`, change only the model, so it calls OpenAI directly:

```diff
+ import { openai } from '@ai-sdk/openai';
```

```diff
-     model: 'openai/gpt-6-astra',
+     model: openai('gpt-6-astra'),
```

In `page.tsx`, change only two lines, so the page talks to its own route:

```diff
- import type { ChatMessage } from './api/chat/route';
+ import type { ChatMessage } from './api/route';
```

```diff
-       api: '/api/chat',
+       api: '/call-tools-multiple-steps/api',
```

Then run `mise run fix`. Biome changes the copied code in two ways that don't
change what it does:

- It switches single quotes to double quotes and rewraps long lines.
- It sorts the imports, so `@ai-sdk/openai` moves above `ai`.

Three lint errors remain in `page.tsx`. Biome can't fix them, and fixing them
by hand would change the recipe. So add a suppression comment above each
one, with a reason:

```tsx
      {messages.map((message, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: kept as in the AI SDK docs
        <div key={index}>
          {/* biome-ignore lint/suspicious/useIterableCallbackReturn: kept as in the AI SDK docs */}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${message.id}-text`}>{part.text}</div>;
              case "tool-getLocation":
              case "tool-getWeather":
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: kept as in the AI SDK docs
                  <div key={`${message.id}-weather-${i}`}>{JSON.stringify(part, null, 2)}</div>
                );
            }
          })}
        </div>
      ))}
```

- `noArrayIndexKey`, twice: the docs use the array index as a React `key`.
- `useIterableCallbackReturn`: the `switch` has no `default`, so the `.map`
  callback returns nothing for other part types.

Inside JSX, the middle comment needs `{/* … */}`. The other two sit before a
JSX element, so `//` works.

### Step 10: Run it and check it

Put your real key in `.env.local` first. Then:

```bash
mise run recipe call-tools-multiple-steps
```

This starts the server and opens the recipe once the server answers. Ask
*"What's the weather where I am?"*. You should see two tool calls,
`getLocation` and then `getWeather`, followed by a text answer. That is the
multi-step loop working.

Both tools are mocks. `getLocation` always returns San Francisco's
coordinates, and `getWeather` always returns 24° and sunny. So this test
proves the loop works: the model calls one tool, reads its output, then calls
the next. It does not fetch real data. Check that each tool part shows an
`output`, not an error, and that the final text uses those outputs.

If OpenAI rejects the model name, your key may not have access to
`gpt-6-astra`. Try a model your key can use, and note the change in the
recipe folder.

Then run the quality gate:

```bash
mise precommit
```

It must pass. Commit with jj.

`next typegen` writes Next's generated types (`next-env.d.ts` and the route
types under `.next/`) without starting the server. `tsc` needs them to check
pages and routes.

### Step 11: Agent instructions

You can do this step as soon as `next dev` has run once (Step 10, or any
`mise run dev`). The first `next dev` writes an `AGENTS.md` file into the project root. It
tells coding agents to read the Next.js docs in `node_modules/next/dist/docs/`
before writing code, because this Next version may differ from what they
learned. Next writes it again if it's missing, so commit it as is.

Then create `CLAUDE.md`. It tells agents about the quality gate, and imports
`AGENTS.md`:

```markdown
@AGENTS.md

Always run `mise precommit` after making changes. It must pass before you
commit.
```

jj has no pre-commit hooks, so nothing runs the gate for you. This file makes
agents run it, and the Conventions section asks you to run it too.

## Starting from a clone

```bash
mise trust
mise install
cp .env.default .env.local      # then put your real key in .env.local
mise run recipe call-tools-multiple-steps
```

`mise run …` installs the packages for you.

## Adding the next recipe

1. Pick a recipe from <https://ai-sdk.dev/resources/recipes> (the `next/` ones).
2. Create `app/<recipe-slug>/`. Use the slug from the recipe's URL.
3. Copy the recipe's files in, using the same mapping as Step 9:
   - the API route goes in `app/<recipe-slug>/api/route.ts`
   - the page goes in `app/<recipe-slug>/page.tsx`
   - any other files keep their names, inside the recipe folder
4. Change the page's `api:` path and import path to point at its own `api/route`.
5. Change the model string to `openai(...)`, and import `openai` from
   `@ai-sdk/openai`.
6. If the recipe needs a new package, run `bun add --exact <package>@<version>`.
7. If it needs a new env var, add the name to `.env.default` and the value to
   `.env.local`.
8. Run `mise run fix`. If a lint error remains in the recipe's own code, add
   a `biome-ignore` comment with a reason. Don't rewrite the recipe.
9. Run `mise run recipe <recipe-slug>` to try it. Run `mise precommit` before
   you commit.
10. Build the Bun version of the same recipe in `vercel-ai-sdk-recipes-bun`.

## Commands

| Command | What it does |
|---|---|
| `mise run recipe <name>` | Start the app and open one recipe |
| `mise run dev` | Start the app; browse all recipes at <http://localhost:3000> |
| `mise precommit` | Fix, then run every check. Run before every commit |
| `mise run fix` | Format, sort imports and apply safe lint fixes only |
| `mise run check` | Run every check; never edits source files (lint, then typecheck) |
| `mise run lint` | Check formatting and lint only |
| `mise run typecheck` | Type-check only |
| `mise run deps:install` | Install dependencies (the other tasks do this for you) |
| `mise lock` | Refresh `mise.lock` after changing a tool version |

`mise <task>` is short for `mise run <task>` when the name doesn't clash with
a mise command, so `mise precommit` works.

To stop the server, press Ctrl-C in its terminal. If port 3000 stays busy
after that, find the old process with `lsof -i :3000` and stop it.

## Conventions

- **Stay close to the docs.** Change only what's needed to run inside a
  recipe folder: the API path, the import path and the model provider. Biome
  formatting and `biome-ignore` comments are also fine. The comparison with
  the Bun version depends on it.
- **One recipe, one folder.** Recipes don't import from each other. If two
  recipes need the same thing, copy it. Duplication is fine in a learning repo.
- **mise is the only entry point.** No `package.json` scripts.
- **Pin exact versions.** Use `bun add --exact <package>@<version>`, and
  commit `bun.lock`.
- **Secrets only in `.env.local`.** Never commit a key.
- **`mise precommit` passes before every commit.**

## Where these choices came from

| Choice | Borrowed from |
|---|---|
| `.env.default` + `.env.local`, loaded by mise | the `chl-email-service` project |
| mise tasks that take arguments (`usage = 'arg …'`) | the `chl-email-service` project |
| Node and Bun pinned together in mise | the Conscious app (`conscious-coach-app`) |
| Biome, strict TypeScript, no npm scripts | the Conscious app |
| `mise precommit` = `fix` then `check`, as separate tasks | the `chl-email-templates` project |
| `deps:install` as a dependency of every task | the `chl-email-templates` project |
| `mise.lock` with `lockfile = true` | the `chl-email-templates` project |
| `noUnusedLocals` and `noUnusedParameters` | the `chl-email-templates` project |
| `CLAUDE.md` telling agents to run `mise precommit` | the `chl-email-templates` project |
