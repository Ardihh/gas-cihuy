<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- GAS-CIHUY-CODEX-RULES v1 -->

# gas-cihuy project rules

## Working agreement

- Never commit or push unless the user explicitly asks.
- Never run `git add .`.
- Do not switch branches, reset, rebase, clean, stash, or discard user changes unless explicitly requested.
- Preserve unrelated working-tree changes.
- Before editing, inspect the relevant existing implementation and tests.
- Prefer minimal changes that solve the requested issue; do not opportunistically refactor unrelated code.
- Do not install or upgrade dependencies unless required and explicitly justified.

## Engineering workflow

- Use Superpowers as the primary workflow for substantial engineering work.
- Keep one coherent workflow for one issue rather than switching between multiple general engineering frameworks.
- Use specialist skills only when relevant:
  - Context7 for current framework/library documentation.
  - UI/UX Pro Max for UI/UX reasoning and audits.
  - shadcn only for shadcn-specific component or registry work.
  - ECC `security-review` for source-level security review.
  - Strix skills only when a security assessment/remediation task explicitly calls for them.
  - Ponytail only when explicitly requested as a second-opinion review/audit.
  - Addy Osmani skills individually for their specialist domains; do not let `using-agent-skills` replace Superpowers as the issue orchestrator.
  - Matt Pocock skills only as targeted specialists or second-pass tools; do not let them replace Superpowers as the primary engineering workflow unless explicitly requested.

## Project conventions

- This is a Next.js App Router project.
- Detect the installed Next.js version from the repository before giving version-sensitive recommendations.
- For Context7, prefer documentation compatible with the installed version. Clearly flag canary/newer documentation before recommending changes.
- Respect existing server/client boundaries and Server Action patterns.
- Keep external API credentials and authenticated API access server-side.
- Do not expose API keys, bearer tokens, session data, or server-only configuration to client code.
- Do not assume shadcn/ui is configured. Verify `components.json` and existing component structure first.
- Preserve the project's existing visual language unless a redesign is explicitly requested.

## Verification

After code changes, run the narrowest relevant checks first.

When appropriate, finish with the repository's existing:
- tests,
- lint,
- build,

using the scripts actually defined in `package.json`.

Do not claim a check passed unless it was actually run successfully.

For UI changes, distinguish source inspection from browser/runtime verification.
For security findings, distinguish confirmed findings from hypotheses or items requiring backend/runtime validation.

## Reporting

At completion, summarize:
1. what changed,
2. files changed,
3. verification performed and results,
4. anything not verified,
5. current git status.

Do not commit or push as part of completion.

<!-- /GAS-CIHUY-CODEX-RULES -->