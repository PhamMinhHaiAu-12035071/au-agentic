# examples/ Validation Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create personal validation workspace for manually testing `/interview` slash command quality end-to-end.

**Architecture:** Simple folder structure with 3 complexity-level examples, each containing initial request template and placeholder files for manual transcript/spec recording.

**Tech Stack:** Plain markdown files, no code.

**Spec:** `docs/plans/2026-04-13-examples-validation-design.md`

---

## Task 1: Gitignore Update

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add examples/ to .gitignore**

Append to `.gitignore`:
```
examples/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore examples/ validation workspace"
```

---

## Task 2: README Documentation

**Files:**
- Create: `examples/README.md`

- [ ] **Step 1: Create `examples/README.md`**

```markdown
# Interview Command Validation Workspace

Workspace cá nhân để test chất lượng của `/interview` slash command end-to-end.

## Purpose

- Manual validation: Test xem `/interview` có hỏi đủ sâu, đủ rõ không
- Quality check: Verify final spec output có đủ chi tiết để implement không
- Cross-tool testing: So sánh quality giữa 4 AI tools

## Workflow

1. **Scaffold slash command** - Run `bunx au-agentic` to install `/interview` in a test project
2. **Pick example** - Choose complexity level: simple/medium/complex
3. **Read initial request** - Open `1-initial-request.md` for vague requirement
4. **Run interview** - Trigger `/interview` with AI tool, paste requirement
5. **Record transcript** - Copy full conversation → `2-interview-transcript.md`
6. **Save final spec** - Save AI's final spec output → `3-final-spec.md`
7. **Evaluate quality** - Check against validation checklist below

## Validation Checklist

**Phase 1 Coverage (must ask):**
- [ ] Objective + Definition of Done
- [ ] Scope + Non-goals
- [ ] Constraints + Environment
- [ ] Dependencies + Risk/Safety

**Phase 2 Coverage (domain-specific):**
- [ ] Technical implementation approach
- [ ] Data model / state
- [ ] Error handling + edge cases
- [ ] Testing strategy
- [ ] Deployment/rollout

**Required Trackers (must maintain):**
- [ ] Coverage matrix
- [ ] Decision log with provenance
- [ ] Unresolved ledger
- [ ] Working spec snapshot

**Closing Sequence:**
- [ ] Batch-confirm assumed-pending items
- [ ] Batch-confirm ai-recommended items
- [ ] Coverage matrix review
- [ ] Final spec confirmation

**Output Quality:**
- [ ] Final spec has all required sections
- [ ] No [UNCONFIRMED - HIGH RISK] items left
- [ ] Spec is implementable without guessing
- [ ] Happy path + edge cases + failure cases documented

## Complexity Definitions

**Simple** (todo-app):
- Single domain (CLI, frontend, or backend only)
- < 5 files
- No external integrations
- Example: Todo list app, calculator CLI

**Medium** (api-service):
- 2-3 domains (e.g., API + database)
- 5-20 files
- Data model needed
- Example: REST API with CRUD, user auth service

**Complex** (infrastructure):
- Multi-domain (cloud + backend + CI/CD + monitoring)
- 20+ files
- Infrastructure/deployment involved
- Example: Microservices deployment, Terraform setup

## Notes

- Folder gitignored - not committed to repo
- Manually fill transcript/spec files after running interview
- Use this to validate before publishing `au-agentic` to npm
```

- [ ] **Step 2: Verify content is complete**

Check README has:
- Purpose section
- 7-step workflow
- Validation checklist
- Complexity definitions

Expected: All sections present.

---

## Task 3: Simple Example Template

**Files:**
- Create: `examples/simple-todo-app/1-initial-request.md`
- Create: `examples/simple-todo-app/2-interview-transcript.md`
- Create: `examples/simple-todo-app/3-final-spec.md`

- [ ] **Step 1: Create `examples/simple-todo-app/1-initial-request.md`**

```markdown
# Initial Request - Simple Todo App

Tôi muốn làm một todo app đơn giản.
```

- [ ] **Step 2: Create placeholder `examples/simple-todo-app/2-interview-transcript.md`**

```markdown
# Interview Transcript

(Manually paste full conversation here after running /interview)
```

- [ ] **Step 3: Create placeholder `examples/simple-todo-app/3-final-spec.md`**

```markdown
# Final Spec Output

(Manually paste final spec here after interview completes)
```

---

## Task 4: Medium Example Template

**Files:**
- Create: `examples/medium-api-service/1-initial-request.md`
- Create: `examples/medium-api-service/2-interview-transcript.md`
- Create: `examples/medium-api-service/3-final-spec.md`

- [ ] **Step 1: Create `examples/medium-api-service/1-initial-request.md`**

```markdown
# Initial Request - API Service

Làm một API service cho user management.
```

- [ ] **Step 2: Create placeholder `examples/medium-api-service/2-interview-transcript.md`**

```markdown
# Interview Transcript

(Manually paste full conversation here after running /interview)
```

- [ ] **Step 3: Create placeholder `examples/medium-api-service/3-final-spec.md`**

```markdown
# Final Spec Output

(Manually paste final spec here after interview completes)
```

---

## Task 5: Complex Example Template

**Files:**
- Create: `examples/complex-infrastructure/1-initial-request.md`
- Create: `examples/complex-infrastructure/2-interview-transcript.md`
- Create: `examples/complex-infrastructure/3-final-spec.md`

- [ ] **Step 1: Create `examples/complex-infrastructure/1-initial-request.md`**

```markdown
# Initial Request - Infrastructure Deployment

Triển khai hệ thống microservices trên AWS.
```

- [ ] **Step 2: Create placeholder `examples/complex-infrastructure/2-interview-transcript.md`**

```markdown
# Interview Transcript

(Manually paste full conversation here after running /interview)
```

- [ ] **Step 3: Create placeholder `examples/complex-infrastructure/3-final-spec.md`**

```markdown
# Final Spec Output

(Manually paste final spec here after interview completes)
```

---

## Verification

**After all tasks:**

- [ ] **Step 1: Verify folder structure**

```bash
ls -R examples/
```

Expected: 3 folders, each with 3 files (1-initial-request, 2-transcript, 3-spec)

- [ ] **Step 2: Verify gitignore works**

```bash
git status
```

Expected: `examples/` does not appear in untracked files

- [ ] **Step 3: Test workflow**

Manually test one example:
1. Read `examples/simple-todo-app/1-initial-request.md`
2. Can you follow the workflow in `examples/README.md`?

Expected: Instructions are clear and actionable.
