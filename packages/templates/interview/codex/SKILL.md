---
name: interview
description: Requirement interview wizard. Transform vague requirements into clear, unambiguous specs using structured Vietnamese Q&A. Use when user says "interview me", "help me define requirements", "phỏng vấn requirement", "biến ý tưởng thành spec", "I have a vague idea", or wants to clarify a feature before implementing.
metadata:
  version: 1.0.0
  author: au-agentic
---
<!-- au-agentic v1.0.0 | tool: codex -->

# Interview

Conduct a structured requirement interview in Vietnamese to transform vague requirements into a clear, unambiguous specification before planning or implementation.

## Quick Start

Use `ask_user_question` (or `request_user_input` if available) to ask structured questions. If neither tool is available, ask questions directly in chat as numbered lists.

Example of a good first question:
```
ask_user_question({
  question: "Bạn muốn build gì?",
  type: "text"
})
```

## Phase 1: Lock Scope

Ask one question at a time to lock these 8 items. Only move to Phase 2 when ALL 8 have status `accepted` in the decision log:

1. `objective` — Mục tiêu cụ thể là gì?
2. `definition of done` — Khi nào coi là xong?
3. `scope` — Những gì nằm trong scope?
4. `non-goals` — Những gì KHÔNG làm?
5. `constraints` — Ràng buộc kỹ thuật, thời gian, team?
6. `environment` — Chạy ở đâu? Stack là gì?
7. `dependencies` — Phụ thuộc gì ngoài?
8. `risk/safety` — Rủi ro lớn nhất?

## Phase 2: Deep Dive

Cover: technical implementation, UI/UX, data model, business rules, edge cases, error handling, testing, rollout, security, performance, trade-offs.

## Question Rules

- Ask **1 question per turn**, highest leverage first
- Use numbered choices: `1. Option A  2. Option B (Recommended)`
- Mark recommended option clearly with `(Recommended)` label
- Allow short answers: `1`, `2`, or `defaults`
- For yes/no: use `ask_user_question` with `type: "confirm"`
- For free text: use `type: "text"`

## Tracking (maintain throughout)

| Tracker | Format |
|---------|--------|
| decision log | `[DEC-###] Decision | Status | Provenance | Risk | Notes` |
| working spec | `Goal | Actors | Core flows | Constraints | Open` |
| coverage matrix | `Domain | Status | Last Updated` |

## Output

When all material ambiguity is resolved, write the final spec to file.
Path fallback: `SPEC.md` → `docs/spec.md` → `specs/[feature-name]-spec.md`

Spec must include: objective, scope, non-goals, done, constraints, UX/UI, data/business rules, technical approach, testing, rollout/ops, risks/trade-offs, acceptance criteria, happy path, edge cases, failure cases, explicit decisions, open risks, out-of-scope.

## References

- Full methodology rules: `references/methodology.md`

## Common Issues

### ask_user_question not available
Ask questions directly in chat as numbered lists. User can reply with `1`, `2`, or the full answer.

### User answers very short (3 turns in a row, <10 words each)
Offer to batch-confirm remaining items with recommended defaults, mark as `assumed-pending`, review in closing sequence.

### Contradiction detected
State the two conflicting answers explicitly. Ask which is correct. Mark superseded option as `superseded` in decision log.
