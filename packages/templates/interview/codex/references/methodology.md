# Interview Methodology

Full methodology for the requirement interview process. Referenced from SKILL.md.

## Working Standards

- By default, prefer asking too much over asking too little if that helps eliminate important ambiguity.
- `Ambiguity` is `material` if different answers could significantly change scope, data model, API contract, UX flow, auth model, deployment strategy, test strategy, risk profile, or effort/migration cost.
- Treat every assumption that could change scope, behavior, architecture, UX, data, tests, rollout, operations, security, performance, or trade-offs as `unclear` until it is locked down.
- Do not stop while any question remains whose answer could change the spec, a technical decision, or the implementation approach.
- Do not ask what can be inferred quickly and safely from the codebase, config, docs, or existing patterns; check those first.
- A branch counts as `clear enough` when: (a) you could write pseudo-code, mock data, acceptance criteria, or a contract for it without guessing; or (b) the next question on that branch would no longer change any technical or product decision already locked in.

## Preflight Before Each Turn

- If the user provides context from a previous session (working spec snapshot, unresolved ledger, decision log, coverage matrix), re-render and confirm before continuing.
- If the user says the old context is outdated: ask whether to (a) start completely over, or (b) keep part of it and update the rest.
- When starting a new session and the user has not provided a clear requirement, open with exactly one question inviting them to describe the requirement. Ask nothing else this turn.

## Mandatory Trackers

Maintain:
- `unresolved ledger`: open questions, open decisions, assumptions needing confirmation, possible conflicts
- `decision log`: [DEC-###] Decision | Status | Provenance | Risk | Notes
- `working spec snapshot`: Goal | Actors | Core flows | Constraints | Open
- `coverage matrix`: Domain | Status | Last Updated
- `scope boundary log`, `scope extension backlog`

Valid statuses: `proposed`, `accepted`, `assumed-pending`, `ai-recommended-pending-confirmation`, `superseded`, `rejected`

## How to Interview

**Phase 1** — Lock: `objective`, `definition of done`, `scope`, `non-goals`, `constraints`, `environment`, `dependencies`, `risk/safety`.
Only move to Phase 2 when all 8 items have an `accepted` entry in the decision log.

**Phase 2** — Deep dive: technical implementation, UI/UX, data model, business rules, edge cases, error handling, state transitions, testing, rollout, observability, performance, security, migration, backward compatibility, failure modes, trade-offs.

Question rules:
- Prefer multiple-choice. Ask only the single most important question per turn.
- When offering choices, present them as `1. Option A, 2. Option B`. Always include a `recommended` option.
- Place `recommended` prominently before the list, with a short reason.
- Only exception: batch up to 3 questions if all 3 are yes/no or multiple-choice, all serve 1 decision, and splitting is pointless.

## Mandatory Coverage

At the start, identify which domains are relevant: CLI, backend/API, frontend/web, mobile/app, native, desktop, cloud/infrastructure, terraform/IaC, data/storage, CI/CD, security/compliance, analytics/telemetry, DX/tooling.

For each relevant domain, dig until it is clear. For each irrelevant domain, explicitly confirm `out of scope`.

## Stopping Condition

End only when:
- No material ambiguity remains
- The unresolved ledger is empty
- The coverage matrix has no `unseen` or `in-progress` items
- Someone else could plan/implement without guessing

## Closing Sequence

1. Batch-confirm all `assumed-pending` items
2. Batch-confirm all `ai-recommended-pending-confirmation` items
3. Show the coverage matrix — ask whether any domain needs to be revisited
4. Present the canonical spec snapshot — final confirmation
5. Render the **final interview report** in chat (no file write): rounds summary (Round N | Topic | Q | A | Decision), full decision log, working spec snapshot, coverage matrix, scope boundary log, scope extension backlog. Highlight `[UNCONFIRMED - HIGH RISK]` assumptions.
