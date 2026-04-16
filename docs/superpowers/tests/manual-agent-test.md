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
