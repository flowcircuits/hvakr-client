# Agent guidance

## Repository purpose and ownership

This repository is the TypeScript/JavaScript SDK for HVAKR's versioned API.
The HVAKR monorepo is the canonical source for the server and shared product
contract; this package mirrors that contract for SDK consumers.

API contract changes intentionally roll out client-first: the SDK method,
types, schemas, tests, and documentation may land here before the corresponding
route is implemented in the separate HVAKR repository. Do not flag a missing
server route as a client bug during review. Require end-to-end server work only
when the task explicitly includes the HVAKR repository, deployment, or live API
verification.

## Working-tree and review scope

- Read any attached brief or review request before inspecting the code.
- Review committed work with `git diff origin/master...HEAD` (three dots).
- Check `git status --short --branch`; if the committed diff is empty but the
  worktree is relevant, inspect the dirty changes with `git diff HEAD`.
- Preserve the current branch name. Do not merge, rebase, commit, push, publish,
  or create a PR unless the user explicitly asks for it.
- Keep reviews conservative and actionable. Do not invent speculative issues or
  report trivial style preferences. `LGTM!` is appropriate when no concrete
  regression is proved.

## Development environment

- Use Node.js 22 and pnpm as specified by `package.json` and
  `CONTRIBUTING.md`.
- `scripts/setup.sh` is the Conductor worktree setup path. It fetches `origin`,
  copies `.env.local` from the main checkout when available, installs
  dependencies, and builds the package.
- Keep workspace-local credentials in `.env.local`; never commit them.

## Validation

- `pnpm test` is the offline/mock-prod suite and is the normal CI gate.
- `pnpm test:prod` runs the live API suite and requires `HVAKR_ACCESS_TOKEN`.
  Use `HVAKR_CLIENT_API_URL` when testing against local or staging server code.
- Run `pnpm build` for public SDK, declaration, or schema changes.
- Run `git diff --check` before handoff.
- Add or update focused tests for new methods, request construction, and public
  schema behavior. Do not add tests that only assert removal or absence of legacy
  fields; that absence is implicit once the canonical field lists, examples, and
  positive schema behavior tests pass. Update `README.md` and `CHANGELOG.md` for
  public API changes.

## Public API and release discipline

- Public methods, exported types, Zod schemas, and generated declarations are
  part of the SDK contract; keep naming and behavior aligned across all of them.
- Keep v0 field names aligned with the HVAKR monorepo canonical schemas. Do not
  keep old public names as aliases.
- This package is pre-1.0. Use the smallest bump that matches the change.
  Follow `PUBLISH.md` for an explicitly requested release.
  - **Patch `0.x.y`:** backwards-compatible fixes, additions, and removal of
    retired unused optional fields that consumers do not depend on
    (display-only config, unused stubs, fields the product no longer stores).
    Precedent: `0.12.1` (`pendingPayment`, pay-per-project license). Do not
    treat every schema field deletion as breaking.
  - **Minor `0.x.0`:** a real breaking change — stored-field **renames**,
    required-shape or type changes, or method-signature changes that force
    existing consumer code to update.
- Do not commit generated `dist/` output or `tsconfig.tsbuildinfo` unless the
  task specifically changes the repository's generated-artifact policy.
- Prefer the smallest compatible dependency or implementation change. Defer
  unrelated breaking upgrades and broad cleanup.

## Conductor and instruction files

`CLAUDE.md` is a symlink to this file. Edit `AGENTS.md`; do not maintain a
second divergent instruction file.
