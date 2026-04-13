# examples/ Validation Workspace - Design

**Version:** 1.0.0  
**Date:** 2026-04-13  
**Status:** Approved

---

## Objective

Create a personal validation workspace (`examples/`) where you can manually test the `/interview` slash command end-to-end across different complexity levels and verify output quality.

---

## Scope

- Create `examples/` folder structure for 3 complexity levels
- Provide README with usage instructions
- Create initial request templates for each complexity level
- Gitignore the entire folder (personal workspace, not committed)

---

## Non-goals

- Automated testing of interview quality (V1 - manual validation only)
- Publishing examples as documentation (gitignored)
- CI/CD integration
- Metrics/analytics collection

---

## Architecture

```
examples/                           # Gitignored - personal validation workspace
├── README.md                       # Instructions: purpose, workflow, validation checklist
├── simple-todo-app/
│   ├── 1-initial-request.md       # Vague initial requirement
│   ├── 2-interview-transcript.md  # Full AI conversation (you fill this)
│   └── 3-final-spec.md           # Spec output (you fill this)
├── medium-api-service/
│   ├── 1-initial-request.md
│   ├── 2-interview-transcript.md
│   └── 3-final-spec.md
└── complex-infrastructure/
    ├── 1-initial-request.md
    ├── 2-interview-transcript.md
    └── 3-final-spec.md
```

**File naming:** Number prefix (1-, 2-, 3-) indicates workflow sequence

**Gitignore:** Add `examples/` to `.gitignore`

---

## Validation Workflow

1. **Scaffold:** Run `bunx au-agentic` to create `/interview` command in a test project
2. **Pick example:** Choose complexity level (simple/medium/complex)
3. **Read initial request:** Open `1-initial-request.md` for the vague requirement
4. **Run interview:** Trigger `/interview` in your AI tool with that requirement
5. **Record transcript:** Copy/paste full conversation to `2-interview-transcript.md`
6. **Save spec:** Save final spec output to `3-final-spec.md`
7. **Evaluate:** Check against validation criteria in README

---

## Content - README.md

**Sections:**
- Purpose: What this folder is for
- Workflow: 7-step validation process above
- Validation Checklist: Quality criteria
  - Did AI ask about scope/non-goals?
  - Did AI maintain decision log/coverage matrix?
  - Did AI close all ambiguities before ending?
  - Is final spec implementable without guessing?
  - Did closing sequence work correctly?
- Complexity Definitions:
  - Simple: Single domain (CLI/frontend/backend only), <5 files
  - Medium: 2-3 domains, data model, 5-20 files
  - Complex: Multi-domain, infrastructure, migrations, 20+ files

---

## Content - Initial Request Templates

**simple-todo-app/1-initial-request.md:**
```
Tôi muốn làm một todo app đơn giản.
```

**medium-api-service/1-initial-request.md:**
```
Làm một API service cho user management.
```

**complex-infrastructure/1-initial-request.md:**
```
Triển khai hệ thống microservices trên AWS.
```

(Deliberately vague để test interview depth)

---

## Gitignore Update

Add to `.gitignore`:
```
examples/
```

Rationale: Personal validation workspace, not repo content

---

## Acceptance Criteria

- [ ] `examples/` folder exists with structure above
- [ ] README.md has clear workflow + validation checklist
- [ ] 3 initial request templates exist (deliberately vague)
- [ ] `examples/` added to .gitignore
- [ ] Folder structure allows manual transcript + spec filling

---

## Out of Scope

- Automated interview quality scoring
- Example transcripts pre-filled (you create these manually)
- Integration with CI
- Publishing to documentation
