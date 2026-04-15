# Gold Rules Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and integrate universal GOLD_RULES.md file applicable to all future projects

**Architecture:** Single foundational document (docs/ai/gold-rules.md) containing universal coding and behavior principles, referenced early in AGENTS.md via new 'Universal Standards' section, inherited implicitly by all project-specific policies

**Tech Stack:** Markdown documentation, git for version control

---

## File Structure

**Files to create:**
- `docs/ai/gold-rules.md` - Universal coding and behavior principles (100-150 lines)

**Files to modify:**
- `AGENTS.md` - Add Universal Standards section after Mission
- `requirements.md` - Add note that content has been integrated into gold-rules.md

---

### Task 1: Create GOLD_RULES.md Foundation

**Files:**
- Create: `docs/ai/gold-rules.md`

- [ ] **Step 1: Create file with standard header metadata**

Create `docs/ai/gold-rules.md` with the following header structure:

```markdown
**Purpose:** Universal coding quality, agent behavior, and efficiency standards that apply across all projects  
**Read this when:** Starting any project, onboarding new agents, establishing project conventions  
**Do not use for:** Project-specific technical choices (see coding-rules.md) or framework-specific patterns  
**Related:** AGENTS.md, coding-rules.md, docs-policy.md  
**Update when:** Core principles evolve, new universal patterns emerge, or fundamental best practices change

---
```

- [ ] **Step 2: Add preamble with override policy**

Add preamble section immediately after header:

```markdown
# Gold Rules

## Preamble

These are universal standards that apply to all projects regardless of technology stack or framework. They represent fundamental principles of quality, efficiency, and clarity.

**Override Policy:** User instructions ALWAYS take precedence over these rules. Project-specific requirements override universal rules when there is a valid reason. These are intelligent defaults, not absolute laws.

---
```

- [ ] **Step 3: Write Code Quality Principles section**

Add comprehensive code quality principles:

```markdown
## 1. Code Quality Principles

**Simplicity First**
- Keep it simple - NEVER over-engineer
- ALWAYS simplify existing code when touching it
- NO unnecessary defensive programming
- NO extra features beyond stated requirements
- Prefer obvious solutions over clever ones

**YAGNI (You Aren't Gonna Need It)**
- Build only what's explicitly needed now
- Don't add features "for future use"
- Don't create abstractions before you have 3+ concrete use cases
- Remove unused code immediately

**Idiomatic & Modern**
- Use latest stable versions of libraries
- Follow language/framework conventions and idioms
- Write code that looks natural in its ecosystem
- Stay current with ecosystem best practices

**Clarity Over Cleverness**
- Prefer readable code over clever tricks
- Choose boring, proven solutions over novel approaches
- Write code that's easy to delete
- Make dependencies and assumptions explicit

---
```

- [ ] **Step 4: Write Agent Behavior Standards section**

Add agent behavior and workflow standards:

```markdown
## 2. Agent Behavior Standards

**Think Before Acting**
- Read existing files before writing code
- Understand the current system before proposing changes
- Ask clarifying questions when requirements are ambiguous
- Never make assumptions when you can ask

**Test Before Claiming Done**
- Test your code before declaring it complete
- Run verification commands and check output
- Evidence before assertions always
- "It should work" is not acceptable - verify it does

**Concise But Thorough**
- Be concise in output but thorough in reasoning
- Skip sycophantic openers and closing fluff ("I'd be happy to help", "Let me know if you need anything else")
- Get straight to the point
- Show, don't tell - provide evidence, not empty reassurance

**Preserve Conventions**
- Follow existing code patterns and styles
- Maintain consistency with the current codebase
- When improving code, respect established conventions
- Don't impose your preferences on existing patterns

---
```

- [ ] **Step 5: Write Efficiency Practices section**

Add efficiency and workflow optimization rules:

```markdown
## 3. Efficiency Practices

**File Reading Discipline**
- Prefer editing over rewriting whole files
- Do not re-read files you've already read unless they may have changed
- Skip files over 100KB unless explicitly required
- Use targeted file reads (specific line ranges) for large files

**Cost Awareness**
- Suggest running /cost when sessions run long to monitor cache ratio
- Recommend starting a new session when switching to unrelated tasks
- Avoid redundant operations (re-reading unchanged files, re-running passing tests)
- Be mindful of token usage in long-running tasks

**Session Management**
- Keep focused on the current task
- Suggest new sessions for unrelated work
- Maintain context efficiently
- Clean up after completing tasks

**Small, Atomic Changes**
- One logical change per commit
- Small diffs are easier to review and debug
- Break large tasks into small, testable increments
- Prefer many small commits over few large commits

---
```

- [ ] **Step 6: Write Documentation Standards section**

Add documentation quality standards:

```markdown
## 4. Documentation Standards

**Minimal & Focused**
- Keep README minimal and actionable
- Document what's not obvious from the code
- Avoid redundant documentation
- Update docs in the same task as code changes

**No Unnecessary Decoration**
- IMPORTANT: no emojis ever (affects parsing, unprofessional, adds noise)
- No ASCII art or box drawing
- No excessive formatting
- Keep it clean and scannable

**Concise Writing**
- Be direct and specific
- Remove filler words
- One idea per paragraph
- Use active voice

**Maintain Documentation**
- Code change without docs update = task incomplete
- Keep documentation in sync with code
- Remove outdated documentation immediately
- Documentation is part of the deliverable, not an afterthought

---
```

- [ ] **Step 7: Write Communication Style section**

Add communication and interaction standards:

```markdown
## 5. Communication Style

**Direct & Professional**
- No sycophantic language or excessive politeness
- Skip empty reassurance and validation
- Be direct: "This will break in production" not "You might want to consider that this could potentially cause issues"
- Respectful but honest feedback

**Evidence-Based**
- Support claims with evidence (logs, test output, code references)
- "I tested this and it passed" requires showing the test output
- Don't claim success without verification
- Uncertainty is better than false confidence

**Concise Output**
- Get to the point quickly
- Remove unnecessary preamble
- Skip obvious statements
- Value the user's time

**Clear Problem Reporting**
- State the problem clearly
- Provide relevant context
- Show what you tried
- Ask specific questions

---
```

- [ ] **Step 8: Add footer with override policy reminder**

Add closing section reinforcing the override policy:

```markdown
## Override Policy (Reminder)

**User instructions ALWAYS take precedence.** If the user says "use emojis" or "add defensive checks," do it. These rules are defaults, not restrictions. Your judgment and the user's needs always come first.

When these rules conflict with project requirements or user preferences, follow the project/user. When they conflict with each other, use judgment and prioritize based on the specific context.
```

- [ ] **Step 9: Verify file structure and content**

Read the complete file to verify:
- Total length is ~100-150 lines (target achieved)
- All 5 categories covered (Code Quality, Agent Behavior, Efficiency, Documentation, Communication)
- Override policy appears in both preamble and footer
- Header metadata follows docs/ai/ conventions
- No examples included (principles only)
- Technology-agnostic language throughout

Run: `wc -l docs/ai/gold-rules.md && cat docs/ai/gold-rules.md`
Expected: Line count between 100-150, complete readable content

- [ ] **Step 10: Commit the gold rules file**

```bash
git add docs/ai/gold-rules.md
git commit -m "feat(docs): add universal GOLD_RULES.md for all projects

- Universal coding quality principles (simplicity, YAGNI, idiomatic code)
- Agent behavior standards (think before acting, test before done)
- Efficiency practices (file reading discipline, cost monitoring)
- Documentation standards (minimal README, no emojis)
- Communication style (no sycophancy, evidence-based)
- Override policy in preamble and footer
- Technology-agnostic and principle-based for universal applicability"
```

---

### Task 2: Integrate GOLD_RULES into AGENTS.md

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Read current AGENTS.md structure**

Run: `cat AGENTS.md`
Expected: See current structure with Mission, Non-Negotiables, Source of Truth, etc.

- [ ] **Step 2: Add Universal Standards section after Mission**

Locate the Mission section (lines 1-3) and add the new section immediately after:

```markdown
# Mission

Smallest correct change. Preserve conventions. Verify before claiming complete.

# Universal Standards

**Read [docs/ai/gold-rules.md](./docs/ai/gold-rules.md) first.** It contains universal coding quality, agent behavior, and efficiency standards that apply across all projects.

All agents must internalize these principles before starting any task. Project-specific rules (below) extend but never contradict these foundational standards.

# Non-Negotiables
```

- [ ] **Step 3: Verify the integration reads naturally**

Run: `head -n 20 AGENTS.md`
Expected: Flow should be: Mission → Universal Standards (with gold-rules.md reference) → Non-Negotiables

- [ ] **Step 4: Update Source of Truth hierarchy if needed**

Check if Source of Truth section needs updating to reflect gold-rules.md priority. Current hierarchy:

```markdown
# Source of Truth

When docs conflict, trust this order:

1. Code (actual implementation)
2. docs/ai/* (AI agent policies)
3. docs/reference/* (API, schemas, config)
4. docs/development/* (workflows, testing)
5. docs/explanations/* (architecture)
6. Other docs/
```

Since gold-rules.md is in docs/ai/, it's already covered by #2. No change needed, but verify this makes sense.

- [ ] **Step 5: Commit the AGENTS.md integration**

```bash
git add AGENTS.md
git commit -m "feat(docs): integrate GOLD_RULES.md into AGENTS.md

Add Universal Standards section after Mission that references
gold-rules.md as foundational principles for all agents.

Flow: Mission → Universal Standards → Non-Negotiables"
```

---

### Task 3: Update requirements.md

**Files:**
- Modify: `requirements.md`

- [ ] **Step 1: Read current requirements.md**

Run: `cat requirements.md`
Expected: See coding standards (lines 1-4) and approach section (lines 6-17)

- [ ] **Step 2: Add integration note at top of file**

Add a note at the very top explaining the file's new role:

```markdown
# Requirements (Historical Reference)

**Note:** The content below has been integrated into [docs/ai/gold-rules.md](./docs/ai/gold-rules.md) as universal standards for all projects. This file is kept as historical reference showing the original sources.

---

# Coding standards
[rest of file unchanged]
```

- [ ] **Step 3: Verify the file is preserved as reference**

Run: `head -n 10 requirements.md && wc -l requirements.md`
Expected: New header visible, total line count increased by ~6 lines

- [ ] **Step 4: Commit the requirements.md update**

```bash
git add requirements.md
git commit -m "docs: mark requirements.md as historical reference

Content has been integrated into docs/ai/gold-rules.md.
File preserved as reference showing original rule sources."
```

---

### Task 4: Verification & Testing

**Files:**
- Test: `docs/ai/gold-rules.md`, `AGENTS.md`, `requirements.md`

- [ ] **Step 1: Manual verification - check file links**

Verify all file references work:
- AGENTS.md references `docs/ai/gold-rules.md` correctly
- requirements.md references `docs/ai/gold-rules.md` correctly
- All relative paths are valid

Run: `ls -la docs/ai/gold-rules.md && grep -n "gold-rules" AGENTS.md requirements.md`
Expected: File exists, references found in both files

- [ ] **Step 2: Manual verification - check content quality**

Read through gold-rules.md and verify:
- Override policy in preamble AND footer
- All 5 categories present (Code Quality, Agent Behavior, Efficiency, Documentation, Communication)
- No technology-specific content
- No examples (principles only)
- Length is ~100-150 lines

Run: `wc -l docs/ai/gold-rules.md && grep -i "override" docs/ai/gold-rules.md`
Expected: Line count 100-150, "override" appears at least twice

- [ ] **Step 3: Agent task test - verify integration works**

Create a test file to verify an agent can access and cite the gold rules:

```bash
echo "# Agent Integration Test

Question for agent: What are the universal standards in this project? Please cite the gold rules.

Expected behavior: Agent should read AGENTS.md → see Universal Standards section → read docs/ai/gold-rules.md → cite specific principles.

Test date: $(date +%Y-%m-%d)
Test status: PENDING
" > docs/superpowers/tests/gold-rules-integration-test.md
```

- [ ] **Step 4: Commit test file and verification results**

```bash
git add docs/superpowers/tests/gold-rules-integration-test.md
git commit -m "test(docs): add gold rules integration test

Agent task test to verify AGENTS.md → gold-rules.md flow works correctly.
Test pending user execution."
```

- [ ] **Step 5: Run project verification if available**

If the project has a verify command, run it:

Run: `bun run verify 2>&1 || echo "No verify command available"`
Expected: Either passes or reports "No verify command available"

- [ ] **Step 6: Final git status check**

Run: `git status`
Expected: Working tree clean, all changes committed

---

## Completion Checklist

When all tasks are complete, verify:

- [ ] `docs/ai/gold-rules.md` exists and is 100-150 lines
- [ ] `AGENTS.md` has Universal Standards section referencing gold-rules.md
- [ ] `requirements.md` has historical reference note
- [ ] All files committed to git with descriptive messages
- [ ] Integration test file created for user verification
- [ ] No technology-specific content in gold-rules.md
- [ ] Override policy stated in both preamble and footer
- [ ] All 5 categories covered (Code Quality, Agent Behavior, Efficiency, Documentation, Communication)

---

## Post-Implementation Notes

**Universal Applicability:** The gold-rules.md file is designed to be technology-agnostic and can be copied to any future project. Simply:
1. Copy `docs/ai/gold-rules.md` to new project
2. Add Universal Standards section to that project's AGENTS.md (or equivalent)
3. Adjust project-specific policies to reference gold-rules.md as foundational

**Maintenance:** Update gold-rules.md when:
- Core principles evolve based on experience
- New universal patterns emerge across multiple projects
- Fundamental best practices change in the industry
- User feedback reveals gaps or ambiguities

**Verification:** After copying to a new project, run the agent task test to ensure the integration works correctly in the new environment.
