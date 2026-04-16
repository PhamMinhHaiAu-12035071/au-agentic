# Interview Recommended Constraint - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add preflight check section to all 4 interview templates to guarantee every multiple-choice question has recommended option with explanation.

**Architecture:** Insert new "Preflight Check" section before "Cách phỏng vấn" in all templates, add link from existing rules (lines 78-81), maintain 100% identical content across platforms.

**Tech Stack:** Markdown templates, Git

---

## File Structure

**Files to Modify:**
- `packages/templates/interview/cursor.md` - Cursor template (157 lines)
- `packages/templates/interview/claude.md` - Claude Code template (~166 lines)
- `packages/templates/interview/copilot.md` - Copilot template (~164 lines)
- `packages/templates/interview/codex/SKILL.md` - Codex skill file (~81 lines)

**Change Pattern:**
Each file gets:
1. New preflight section (~35 lines) inserted before "## Cách phỏng vấn"
2. One line added to existing rules section (after lines 78-81)

**No New Files Created:** All changes are modifications to existing templates.

---

### Task 1: Update Cursor Template

**Files:**
- Modify: `packages/templates/interview/cursor.md`

- [ ] **Step 1: Read current cursor template**

```bash
cat packages/templates/interview/cursor.md
```

Expected: See 157 lines, line 64 starts with "## Cách phỏng vấn"

- [ ] **Step 2: Insert preflight section before line 64**

Insert this content before line 64 (before "## Cách phỏng vấn"):

```markdown
## Preflight Check cho Câu Hỏi Multiple-Choice

**BẮT BUỘC:** Trước khi hiển thị BẤT KỲ câu hỏi multiple-choice nào (từ 2 options trở lên), bạn PHẢI tự kiểm tra và tự sửa:

1. **Có Option Recommended:** Ít nhất 1 option được đánh dấu rõ ràng là `(Recommended)` hoặc có nhãn recommended
2. **Có Giải Thích:** Option recommended phải kèm 1-2 câu giải thích VÌ SAO bạn chọn nó
3. **Chất Lượng Giải Thích:** Giải thích phải dựa trên context cụ thể: pattern codebase hiện tại, constraints, trade-offs, hoặc blast radius

**Quy Trình Auto-Fix:**
- Nếu bạn sắp hiển thị câu hỏi multiple-choice mà thiếu bất kỳ điều nào ở trên, DỪNG LẠI
- Tự bổ sung nhãn recommended và giải thích NGAY BÂY GIỜ trước khi show cho user
- Cơ sở để recommend: context codebase hiện tại, conservative defaults (blast radius nhỏ nhất + migration cost thấp nhất), hoặc pattern đã có
- Nếu không có context codebase, hãy chọn option có blast radius nhỏ nhất và migration cost thấp nhất, rồi nói rõ "Đây là conservative default vì chưa có context cụ thể"

**Format Bắt Buộc:**

**Recommended:** Option X — [1-2 câu giải thích cụ thể dựa trên context]

**Options:**
1. Option X (Recommended)
2. Option Y  
3. Option Z

**Ví Dụ:**
```
**Recommended:** Option A — Tôi chọn cách này vì codebase hiện tại đã dùng pattern X trong module Y, giữ consistency sẽ giảm blast radius khi maintain.

**Options:**
1. Option A (Recommended)
2. Option B
3. Không chắc, dùng recommended
```

**Đảm Bảo Fail-Fast:** Check này xảy ra TRƯỚC KHI bạn hiển thị câu hỏi. User chỉ nhìn thấy phiên bản đã được sửa đúng.

```

- [ ] **Step 3: Add link line after line 81 (now line 116 after insertion)**

After the existing line:
```markdown
- Nếu chưa có codebase hoặc context đủ để recommend, hãy chọn phương án có `blast radius` nhỏ nhất và `migration cost` thấp nhất, rồi nói rõ đây là `conservative default`.
```

Add this line:
```markdown
- **CHÚ Ý:** Xem "Preflight Check cho Câu Hỏi Multiple-Choice" ở trên để biết cách tự kiểm tra và tự sửa trước khi hiển thị câu hỏi.
```

- [ ] **Step 4: Verify changes with diff**

```bash
git diff packages/templates/interview/cursor.md
```

Expected: Shows +36 lines (35 for preflight section + 1 for link line)

- [ ] **Step 5: Verify file syntax and structure**

```bash
head -n 100 packages/templates/interview/cursor.md | grep "## "
```

Expected: See new "## Preflight Check cho Câu Hỏi Multiple-Choice" before "## Cách phỏng vấn"

- [ ] **Step 6: Commit**

```bash
git add packages/templates/interview/cursor.md
git commit -m "feat(interview): add preflight check for recommended constraint in cursor template

Add mandatory preflight check section to enforce that every multiple-choice
question includes a recommended option with 1-2 sentence explanation based on
codebase context or conservative defaults.

Changes:
- Insert preflight section before 'Cách phỏng vấn' (line 64)
- Add reference link from existing rules (after line 81)

Part of interview recommended constraint enhancement."
```

---

### Task 2: Update Claude Code Template

**Files:**
- Modify: `packages/templates/interview/claude.md`

- [ ] **Step 1: Read current claude template**

```bash
cat packages/templates/interview/claude.md | head -n 100
```

Expected: See template structure, find "## Cách phỏng vấn" around line 74

- [ ] **Step 2: Insert preflight section before "## Cách phỏng vấn" (line 74)**

Insert the same preflight content as Task 1 Step 2 before line 74.

- [ ] **Step 3: Add link line after the conservative default line**

Find the line with "conservative default" in the rules section (around line 87-90), then add the same link line as Task 1 Step 3.

- [ ] **Step 4: Verify changes with diff**

```bash
git diff packages/templates/interview/claude.md
```

Expected: Shows +36 lines total

- [ ] **Step 5: Compare with cursor template for consistency**

```bash
diff <(grep -A 35 "## Preflight Check" packages/templates/interview/cursor.md) \
     <(grep -A 35 "## Preflight Check" packages/templates/interview/claude.md)
```

Expected: No differences (content is identical)

- [ ] **Step 6: Commit**

```bash
git add packages/templates/interview/claude.md
git commit -m "feat(interview): add preflight check for recommended constraint in claude template

Add identical preflight check section as cursor template to enforce recommended
option with explanation for all multiple-choice questions.

Changes:
- Insert preflight section before 'Cách phỏng vấn' (line 74)
- Add reference link from existing rules section

Part of interview recommended constraint enhancement."
```

---

### Task 3: Update Copilot Template

**Files:**
- Modify: `packages/templates/interview/copilot.md`

- [ ] **Step 1: Read current copilot template**

```bash
cat packages/templates/interview/copilot.md | head -n 100
```

Expected: See template structure, find "## Cách phỏng vấn" around line 71

- [ ] **Step 2: Insert preflight section before "## Cách phỏng vấn" (line 71)**

Insert the same preflight content as Task 1 Step 2 before line 71.

- [ ] **Step 3: Add link line after the conservative default line**

Find the line with "conservative default" in the rules section (around line 84-87), then add the same link line as Task 1 Step 3.

- [ ] **Step 4: Verify changes with diff**

```bash
git diff packages/templates/interview/copilot.md
```

Expected: Shows +36 lines total

- [ ] **Step 5: Compare with cursor and claude templates for consistency**

```bash
# Compare preflight sections across all 3 templates
diff <(grep -A 35 "## Preflight Check" packages/templates/interview/cursor.md) \
     <(grep -A 35 "## Preflight Check" packages/templates/interview/copilot.md)
```

Expected: No differences

- [ ] **Step 6: Commit**

```bash
git add packages/templates/interview/copilot.md
git commit -m "feat(interview): add preflight check for recommended constraint in copilot template

Add identical preflight check section to enforce recommended option with
explanation for all multiple-choice questions. Maintains cross-platform
consistency.

Changes:
- Insert preflight section before 'Cách phỏng vấn' (line 71)
- Add reference link from existing rules section

Part of interview recommended constraint enhancement."
```

---

### Task 4: Update Codex Skill File

**Files:**
- Modify: `packages/templates/interview/codex/SKILL.md`

- [ ] **Step 1: Read current codex skill file**

```bash
cat packages/templates/interview/codex/SKILL.md
```

Expected: See shorter skill file (~81 lines), references to "references/methodology.md"

- [ ] **Step 2: Find insertion point**

```bash
grep -n "## Phase 2" packages/templates/interview/codex/SKILL.md
```

Expected: Find "## Phase 2: Deep Dive" around line 27-30

- [ ] **Step 3: Insert simplified preflight section before "## Phase 2"**

Insert this adapted version (shorter for skill file) after "## Phase 1: Lock Scope" section:

```markdown
## Preflight Check for Multiple-Choice

**MANDATORY before displaying any multiple-choice (2+ options):**

1. Has `(Recommended)` label on ≥1 option?
2. Has 1-2 sentence explanation WHY you chose it?
3. Explanation based on: codebase patterns, constraints, trade-offs, or blast radius?

**Auto-Fix:** If missing any above, STOP and add before showing to user.

**Conservative Default:** If no codebase context, choose lowest blast radius + migration cost option, state "Đây là conservative default vì chưa có context cụ thể".

**Example:**
```
**Recommended:** Option A — Tôi chọn cách này vì codebase hiện tại đã dùng pattern X trong module Y, giữ consistency sẽ giảm blast radius khi maintain.

**Options:**
1. Option A (Recommended)
2. Option B
3. Không chắc, dùng recommended
```

```

- [ ] **Step 4: Add note in Question Rules section**

Find the section about question rules (around line 43-50), add this line:

```markdown
- **See:** Preflight Check section above for mandatory validation before showing multiple-choice questions
```

- [ ] **Step 5: Verify changes with diff**

```bash
git diff packages/templates/interview/codex/SKILL.md
```

Expected: Shows +20-25 lines added

- [ ] **Step 6: Verify the adapted section maintains core requirements**

Check that the codex version includes:
- Mandatory 3-point checklist
- Auto-fix protocol
- Conservative default fallback
- Example with explanation

```bash
grep -A 10 "MANDATORY" packages/templates/interview/codex/SKILL.md
```

Expected: See all 3 checklist items

- [ ] **Step 7: Commit**

```bash
git add packages/templates/interview/codex/SKILL.md
git commit -m "feat(interview): add preflight check for recommended constraint in codex skill

Add condensed preflight check section adapted for codex skill file format.
Maintains core requirements while fitting skill file's concise structure.

Changes:
- Insert preflight section before 'Phase 2: Deep Dive'
- Add reference note in Question Rules section
- Adapted length but identical semantics

Part of interview recommended constraint enhancement."
```

---

### Task 5: Verify Cross-Platform Consistency

**Files:**
- Verify: All 4 template files

- [ ] **Step 1: Extract and compare preflight content**

```bash
# Extract preflight sections from all files
grep -A 30 "## Preflight Check" packages/templates/interview/cursor.md > /tmp/cursor_preflight.txt
grep -A 30 "## Preflight Check" packages/templates/interview/claude.md > /tmp/claude_preflight.txt
grep -A 30 "## Preflight Check" packages/templates/interview/copilot.md > /tmp/copilot_preflight.txt
grep -A 20 "## Preflight Check" packages/templates/interview/codex/SKILL.md > /tmp/codex_preflight.txt
```

- [ ] **Step 2: Verify cursor, claude, copilot are identical**

```bash
diff /tmp/cursor_preflight.txt /tmp/claude_preflight.txt
diff /tmp/cursor_preflight.txt /tmp/copilot_preflight.txt
```

Expected: No differences between these 3 files

- [ ] **Step 3: Verify codex has equivalent semantics**

Manually check `/tmp/codex_preflight.txt` contains:
- [ ] 3-point mandatory checklist
- [ ] Auto-fix protocol
- [ ] Conservative default fallback
- [ ] Example with explanation

```bash
cat /tmp/codex_preflight.txt
```

- [ ] **Step 4: Verify link lines exist in all files**

```bash
grep "CHÚ Ý.*Preflight Check" packages/templates/interview/cursor.md
grep "CHÚ Ý.*Preflight Check" packages/templates/interview/claude.md
grep "CHÚ Ý.*Preflight Check" packages/templates/interview/copilot.md
grep "See.*Preflight Check" packages/templates/interview/codex/SKILL.md
```

Expected: Each command returns 1 match

- [ ] **Step 5: Count total lines added**

```bash
git diff --stat HEAD~4
```

Expected: Show ~36 lines added to cursor.md, claude.md, copilot.md; ~23 lines to codex SKILL.md

- [ ] **Step 6: Run final visual inspection**

```bash
# Open each file and visually verify section placement
code packages/templates/interview/cursor.md
code packages/templates/interview/claude.md
code packages/templates/interview/copilot.md
code packages/templates/interview/codex/SKILL.md
```

Checklist for each file:
- [ ] Preflight section appears before "Cách phỏng vấn" / "Phase 2"
- [ ] Link/reference line appears in rules section
- [ ] Vietnamese language throughout (matching existing style)
- [ ] No trailing whitespace or formatting issues

- [ ] **Step 7: Create summary commit if needed**

If any minor formatting fixes were needed:

```bash
git add -A
git commit -m "chore(interview): minor formatting fixes for preflight sections

Clean up any trailing whitespace or formatting inconsistencies
in preflight check sections across all 4 templates."
```

---

### Task 6: Update Documentation and Create Test Plan

**Files:**
- Create: `docs/superpowers/tests/manual-agent-test.md` (if doesn't exist)
- Modify: Design doc to mark as implemented

- [ ] **Step 1: Create manual test plan document**

```bash
mkdir -p docs/superpowers/tests
```

Create `docs/superpowers/tests/manual-agent-test.md`:

```markdown
# Manual Agent Test Plan - Interview Recommended Constraint

## Test Date: [To be filled by tester]
## Tester: [User name]

## Test Environment
- [ ] Cursor
- [ ] Claude Code  
- [ ] GitHub Copilot
- [ ] Codex CLI

## Test Cases

### TC1: Multiple-Choice with Codebase Context
**Platform:** _______  
**Input:** Run `/interview` on project with existing patterns  
**Expected:** AI asks multiple-choice question with:
- [ ] At least one option labeled `(Recommended)`
- [ ] 1-2 sentence explanation referencing actual codebase patterns
- [ ] Explanation mentions specific files/patterns/constraints

**Actual Result:**
_______

**Pass/Fail:** _______

---

### TC2: Multiple-Choice without Codebase Context
**Platform:** _______  
**Input:** Run `/interview` on empty/greenfield project  
**Expected:** AI asks multiple-choice question with:
- [ ] At least one option labeled `(Recommended)`
- [ ] 1-2 sentence explanation
- [ ] Explanation mentions "conservative default" or "blast radius nhỏ nhất"

**Actual Result:**
_______

**Pass/Fail:** _______

---

### TC3: Yes/No Question (Should Skip Preflight)
**Platform:** _______  
**Input:** AI asks yes/no question during interview  
**Expected:**
- [ ] Question displayed normally
- [ ] No recommended requirement (only 2 options: yes/no)

**Actual Result:**
_______

**Pass/Fail:** _______

---

### TC4: Cross-Platform Consistency
**Platforms:** All 4  
**Input:** Run same interview scenario on all platforms  
**Expected:**
- [ ] Recommended option appears on all platforms
- [ ] Explanation quality similar across platforms
- [ ] No need to add manual prompt reminders

**Actual Result:**
_______

**Pass/Fail:** _______

---

## Overall Assessment

**Total Tests Run:** _______  
**Passed:** _______  
**Failed:** _______  

**Issues Found:**
_______

**Sign-off:** _______  **Date:** _______
```

- [ ] **Step 2: Commit test plan**

```bash
git add docs/superpowers/tests/manual-agent-test.md
git commit -m "docs(interview): add manual test plan for recommended constraint

Create test plan template for validating preflight check behavior
across all 4 platforms (Cursor, Claude Code, Copilot, Codex).

Includes test cases for:
- Multiple-choice with/without codebase context
- Yes/no questions (should skip preflight)
- Cross-platform consistency"
```

- [ ] **Step 3: Update design doc status**

Modify `docs/superpowers/specs/2026-04-16-interview-recommended-constraint-design.md`:

Change line 4 from:
```markdown
**Status:** Design Complete - Ready for Implementation
```

To:
```markdown
**Status:** Implemented - Ready for Testing
```

- [ ] **Step 4: Add implementation notes to design doc**

At the end of the design doc, add:

```markdown
---

## Implementation Notes

**Implementation Date:** 2026-04-16  
**Implementation Summary:**
- Added preflight check section to all 4 templates (cursor, claude, copilot, codex)
- Cursor, Claude, Copilot templates have identical 35-line preflight section
- Codex skill file has adapted 23-line version with equivalent semantics
- Link lines added to existing rules sections in all templates
- Total changes: ~131 lines added across 4 files

**Files Modified:**
1. `packages/templates/interview/cursor.md` (+36 lines)
2. `packages/templates/interview/claude.md` (+36 lines)
3. `packages/templates/interview/copilot.md` (+36 lines)
4. `packages/templates/interview/codex/SKILL.md` (+23 lines)

**Testing Status:** Manual testing required - see `docs/superpowers/tests/manual-agent-test.md`

**Next Steps:**
1. User runs manual tests on all 4 platforms
2. Document any issues found
3. Iterate if needed based on test results
```

- [ ] **Step 5: Commit updated design doc**

```bash
git add docs/superpowers/specs/2026-04-16-interview-recommended-constraint-design.md
git commit -m "docs(interview): mark design as implemented with implementation notes

Update design doc status and add implementation summary with
file changes, line counts, and next steps for testing."
```

---

### Task 7: Final Verification and Cleanup

**Files:**
- Verify: All changes committed
- Verify: Git history clean

- [ ] **Step 1: Verify all files committed**

```bash
git status
```

Expected: Working tree clean, no uncommitted changes

- [ ] **Step 2: Review commit history**

```bash
git log --oneline -7
```

Expected: See 7 commits:
1. feat(interview): add preflight check for cursor template
2. feat(interview): add preflight check for claude template
3. feat(interview): add preflight check for copilot template
4. feat(interview): add preflight check for codex skill
5. chore(interview): minor formatting fixes (if any)
6. docs(interview): add manual test plan
7. docs(interview): mark design as implemented

- [ ] **Step 3: Generate summary of changes**

```bash
git diff HEAD~7 --stat
```

Expected: Show changes to 4 template files + 2 doc files

- [ ] **Step 4: Verify no unintended changes**

```bash
git diff HEAD~7 --name-only
```

Expected: Only see these files:
- packages/templates/interview/cursor.md
- packages/templates/interview/claude.md
- packages/templates/interview/copilot.md
- packages/templates/interview/codex/SKILL.md
- docs/superpowers/tests/manual-agent-test.md
- docs/superpowers/specs/2026-04-16-interview-recommended-constraint-design.md

- [ ] **Step 5: Create implementation summary**

```bash
echo "Implementation Summary:
- Modified: 4 template files
- Added: 1 test plan document
- Updated: 1 design document
- Total commits: 7
- Total lines added: ~131 across templates
- Status: Ready for user testing" > /tmp/implementation-summary.txt

cat /tmp/implementation-summary.txt
```

- [ ] **Step 6: Final checklist**

Verify all requirements met:
- [ ] Preflight section added to all 4 templates
- [ ] Content identical across cursor, claude, copilot
- [ ] Codex has equivalent semantics
- [ ] Link lines added in all files
- [ ] Vietnamese language maintained
- [ ] No placeholders or TODOs in added content
- [ ] All changes committed
- [ ] Test plan created
- [ ] Design doc updated

---

## Plan Self-Review

**Spec Coverage Check:**

| Spec Requirement | Task(s) | Status |
|------------------|---------|--------|
| Add preflight section before "Cách phỏng vấn" | Tasks 1-4 | ✓ Covered |
| Modify lines 78-81 to add link | Tasks 1-4, Step 3 | ✓ Covered |
| Identical content across cursor/claude/copilot | Tasks 1-3, Task 5 | ✓ Covered |
| Equivalent semantics in codex | Task 4, Task 5 Step 3 | ✓ Covered |
| Vietnamese language | All tasks | ✓ Covered |
| Cross-platform validation | Task 5 | ✓ Covered |
| Test plan creation | Task 6 | ✓ Covered |
| Design doc update | Task 6 Steps 3-4 | ✓ Covered |

**Placeholder Scan:** No TBD, TODO, or incomplete content in any task.

**Consistency Check:** All file paths exact, all commands complete with expected output, all code blocks show full content.

**No Gaps Found.**

---

## Execution Notes

**Estimated Time:** 30-40 minutes total
- Task 1-4: 5-7 minutes each (20-28 minutes)
- Task 5: 5 minutes
- Task 6: 3-5 minutes
- Task 7: 2 minutes

**Prerequisites:**
- Git working tree clean before starting
- Text editor ready (VSCode, vim, or similar)
- Terminal open in workspace root

**Risk Factors:**
- Low risk: Only modifying documentation files
- No code changes, so no runtime failures possible
- Worst case: Template syntax error (easily fixed)

---
