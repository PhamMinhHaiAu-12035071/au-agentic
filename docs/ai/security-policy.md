**Purpose:** Security rules for handling secrets, tokens, and sensitive configuration
**Read this when:** Security tasks or auth-sensitive area changes
**Do not use for:** General coding rules (see `coding-rules.md`)
**Related:** `SECURITY.md`, `docs/reference/configuration.md`, `docs/reference/integrations.md`
**Update when:** Security policies added or sensitive areas identified

---

# Security Policy

## Core Rule

Commit-time checks are necessary but not sufficient. Never commit secrets, API keys, tokens, passwords, private keys, or credential files to git, and never treat a local hook as the only enforcement layer.

If a secret is found anywhere in the repo, treat it as a release-blocking incident even if it only exists in a local branch or rewritten history.

## Coverage Model

| Boundary | What it protects | Required guard |
|----------|------------------|----------------|
| Working tree | obvious hardcoding while authoring | use env vars, keychain, ignored `.env` files |
| Commit | accidental leaks before they leave the machine | pre-commit secret scan |
| History rewrite (`--amend`, `rebase`, `cherry-pick`) | rewritten commits that reintroduce a secret | rescan the rewritten diff/history |
| Push | secrets about to leave local control | pre-push secret scan |
| Remote receive / protected branches | authoritative policy enforcement | server-side `pre-receive` or `update` hook, plus CI |
| Release / publish | final gate before distribution | release pipeline scan and human approval when needed |

## Sensitive Material

- API keys, access tokens, passwords, signing keys, SSH private keys, webhook secrets
- `.env`, `.secret`, `credentials.json`, and similar local secret files
- Auth config, service accounts, customer data, or any value that grants access

## Required Practices

- Prefer environment variables for runtime secrets.
- Use the system keychain or another OS secret store for local development.
- Keep secret-bearing files out of git with `.gitignore`.
- Validate sensitive changes before commit and before push.
- Never rely on local hooks alone; they are convenience, not enforcement.
- Do not use `--no-verify` to bypass secret checks.
- If a change needs secrets, document the secret names and expected shape in `docs/reference/configuration.md`, not the secret values.

## Checks To Run

```bash
rg -n -i "api[_-]?key|token|password|secret|credential|webhook|private key" .
rg -n "\.env|\.secret|credentials\.json" .gitignore
```

## Incident Response

1. Stop the change immediately.
2. Remove the secret from the working tree and any newly created commits.
3. Rotate or revoke the exposed credential.
4. If it entered history, rewrite only the affected history and rebuild a clean branch.
5. Add a regression check so the same pattern cannot return.

## Current State

This repo currently has no secrets handling, auth, or external integrations. The policy is preventive now, and it should expand as soon as any of these appear:

- Remote API calls
- Auth or authorization
- Webhooks or service accounts
- Deployment credentials
- Publish tokens
- Customer or production data

## Secret scanning

au-agentic uses **secretlint** (project-scope npm package) to block secrets at commit time and to scan the full repo in CI. The previous gitleaks system binary was removed in ADR-0007 because it required `brew install` and violated the project-scope dependency rule.

- **Pre-commit:** Lefthook runs `bunx secretlint --maskSecrets --secretlintignore .secretlintignore {staged_files}` on every `git commit`. Failures abort the commit.
- **CI:** `verify.yml` runs secretlint over the full working tree. (CI is currently `workflow_dispatch` only; see `docs/deployment/runbooks.md`.)
- **Config:** `.secretlintrc.json` enables `@secretlint/secretlint-rule-preset-recommend` (AWS, GCP, Slack, GitHub, npm, private keys, SendGrid, basic auth). `.secretlintignore` allowlists `packages/templates/**` (placeholder tokens) and cache/build directories.

If a real secret has been committed, rotate the credential first, then remove from history with `git filter-repo` or BFG. Secretlint detects but does not remove history.

## Source Of Truth

When secret-handling is introduced, update `docs/reference/configuration.md` for configuration shape, `docs/reference/integrations.md` for external systems, and `SECURITY.md` for user-facing reporting.
