**Purpose:** Universal coding quality, agent behavior, and efficiency standards that apply across all projects
**Read this when:** Starting any project, onboarding a new agent, establishing project conventions
**Do not use for:** Project-specific technical choices (see coding-rules.md) or framework-specific patterns
**Related:** AGENTS.md, docs/ai/docs-policy.md, coding-rules.md
**Update when:** Core principles evolve, new universal patterns emerge, or fundamental best practices change

---

# Gold Rules

## Preamble

These standards apply to all projects regardless of technology stack or framework. They are universal defaults for quality, clarity, and efficiency in both agent and developer work.

**Override Policy:** User instructions ALWAYS take precedence over these rules. Project-specific requirements override these universal rules when there is a valid reason. These are intelligent defaults, not absolute laws.

---

## 1) Code Quality Principles

### 1.1 Simplicity First

- Keep it simple, avoid over-engineering
- ALWAYS simplify existing code when touching it
- NO unnecessary defensive programming
- NO extra features beyond explicit requirements
- Prefer obvious solutions over clever ones

### 1.2 YAGNI (You Aren't Gonna Need It)

- Build only what is explicitly needed now
- Do not add features for hypothetical future use
- Avoid abstractions without at least two clear, concrete use cases
- Remove unused code soon after it becomes unnecessary

### 1.3 Idiomatic and Current

- Use idiomatic patterns for the chosen language or framework
- Use latest stable versions of libraries and approaches
- Stay current with ecosystem best practices
- Prefer conventions that reduce surprise for future maintainers

### 1.4 Clarity Over Cleverness

- Make code behavior explicit and readable
- Choose boring, proven solutions over fragile novelty
- Make dependencies and assumptions visible
- Write code that is easy to delete or refactor

## 2) Agent Behavior Standards

### 2.1 Think Before Acting

- Read existing files before writing code
- Understand context before proposing changes
- Ask clarifying questions when requirements are unclear
- Prefer explanation and confirmation before proceeding on ambiguous assumptions

### 2.2 Test Before Claiming Done

- Run verification commands before declaring completion
- Do not claim correctness without evidence
- Use output logs and command results as proof
- Report failures clearly and resolve before final handoff

### 2.3 Preserve Conventions

- Follow established project patterns and styles
- Respect existing naming and structure
- Keep scope tight to the requested change
- Improve nearby code only when it serves the current goal

### 2.4 Communication Standards for Agents

- Be concise in output
- Skip sycophantic openers and closing fluff
- Provide direct recommendations with rationale
- Be honest about uncertainty instead of guessing

## 3) Efficiency and Workflow Practices

### 3.1 File Reading Discipline

- Prefer editing over rewriting full files
- Do not re-read files already read unless they may have changed
- Skip files over 100KB unless explicitly required
- Use focused reads for large files

### 3.2 Cost and Session Awareness

- Suggest running `/cost` when sessions run long to monitor cache ratio
- Recommend starting a new session when switching to unrelated tasks
- Avoid repeated expensive operations on unchanged state
- Track progress in small incremental steps

### 3.3 Change Management

- Prefer small, tightly scoped commits
- Keep changes reviewable and reversible
- Decompose large work into narrow, incremental tasks

## 4) Documentation Standards

### 4.1 Minimal and Practical Documentation

- Keep README concise and actionable
- Add only useful, non-redundant documentation
- Update docs in the same task as code changes
- Remove outdated instructions promptly

### 4.2 Clean and Accessible Writing

- No emojis in required documentation and status updates
- No unnecessary decorative formatting
- Use clear headings, short paragraphs, direct language
- Prefer examples only when they add clarity, not noise

## 5) Communication Style

### 5.1 Professional Clarity

- Be direct, specific, and non-fluffy
- Do not over-explain what is obvious
- State risks, assumptions, and trade-offs explicitly
- Ask for confirmation when constraints are uncertain

### 5.2 Evidence-Driven Reporting

- Tie conclusions to actual evidence (commands, logs, diffs)
- Separate facts from speculation
- If uncertain, state what is known and what is unknown
- Never assert success without verification output

## Override Policy (Reminder)

**User instructions ALWAYS take precedence.** If the user asks for a different approach (including style choices such as emojis or explicit checks), follow the user request.

When these rules conflict with project requirements or explicit preferences, follow project/user context first.

