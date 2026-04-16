# Strengthen Interview "Recommended" Constraint - Design Document

**Version:** 1.0.0  
**Date:** 2026-04-16  
**Prepared by:** AI-assisted (Claude Sonnet 4.5)  
**Status:** Implemented - Ready for Testing

---

## Objective

Strengthen the "recommended" constraint in the interview command to guarantee that EVERY multiple-choice question has at least one recommended option with a detailed explanation, working consistently across all 4 platforms (Cursor, Claude Code, Copilot, Codex).

## Problem Statement

**Current State:**
- Lines 78-81 in all templates use semantic language "luôn phải có" (must always have)
- Rule is descriptive but lacks enforcement mechanism
- User must manually add reminders like "nên có ít nhất 1 option Recommended và giải thích lý do" to prompts
- Behavior is inconsistent across Claude Code, Cursor, Copilot, and Codex

**User Complaint:**
> "Tại khi tôi xài thực tế trên claude code, cursor, copilot hay codex tôi đều phải thêm mô tả vào prompt nữa mới cho kết quả đúng tôi kỳ vọng."

**Goal:**
Create fail-fast constraint that guarantees:
1. EVERY multiple-choice question MUST have ≥1 "recommended" option
2. EVERY recommended option MUST have detailed explanation (1-2 sentences) of WHY it was chosen
3. Works identically across all 4 platforms without manual reminders

## Scope

**In Scope:**
- Add new "Preflight Check" section before "Cách phỏng vấn" section
- Modify existing rules (lines 78-81) to link to preflight section
- Apply to multiple-choice questions only (2+ options)
- Auto-fix mechanism: AI self-corrects before displaying to user
- Concise explanations (1-2 sentences)
- Cross-platform consistency (identical wording)

**Out of Scope:**
- Yes/no questions (no options to recommend)
- Open-ended text input questions
- Changes to other interview methodology rules
- Platform-specific customizations

## Non-Goals

- Adding runtime validation that reports errors to user (we use auto-fix instead)
- Extending constraint to all question types
- Changing the interview flow or phase structure

## Definition of Done

- [ ] New preflight section added to all 4 templates
- [ ] Existing rules (lines 78-81) updated with link to preflight
- [ ] All 4 templates have identical preflight content (diff verified)
- [ ] User can run `/interview` without adding manual reminders
- [ ] AI always includes recommended + explanation in multiple-choice questions
- [ ] Design doc committed to git
- [ ] Implementation plan created

## Constraints

- **Language:** Vietnamese (to match existing template style)
- **Placement:** Before "## Cách phỏng vấn" section
- **Additive Only:** No removal of existing rules
- **Cross-Platform:** 100% identical wording across all 4 tools

## Architecture

### Approach: Structural Enforcement with Preflight Protocol

**Selected Approach:** Approach 1 - Structural gate that AI must pass through before displaying any multiple-choice question.

**Why This Approach:**
1. **Proven Pattern:** Structural gates work better than implicit rules for AI behavior enforcement
2. **User Evidence:** User tested current semantic rules across 4 platforms and found them insufficient
3. **Maintainability:** Validation logic is isolated in one section, easy to adjust if needed
4. **Clear Accountability:** If AI violates, we know exactly which section it skipped

**Rejected Alternatives:**
- **Approach 2 (Inline Reinforcement):** Would bury rule in existing text, easy to miss
- **Approach 3 (Template-Enforced):** Too rigid, would constrain legitimate flexibility

### Component Design

#### 1. New Preflight Check Section

**Content (Vietnamese):**

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

**Key Design Decisions:**

1. **Imperative Language:** "BẮT BUỘC", "PHẢI", "DỪNG LẠI" signal non-negotiable requirement
2. **3-Point Checklist:** Simple, verifiable criteria
3. **Auto-Fix Explicit:** States user only sees corrected version
4. **Example Included:** Shows exactly what good looks like
5. **Conservative Default Fallback:** Clear guidance when no codebase context

#### 2. Modifications to Existing Rules (Lines 78-81)

**Current:**
```markdown
- Khi đưa lựa chọn, luôn phải có ít nhất 1 option `recommended` do chính bạn chọn là phù hợp nhất với codebase hoặc dự án hiện tại.
- Mỗi option `recommended` phải kèm giải thích ngắn gọn vì sao bạn chọn nó, dựa trên codebase, pattern hiện có, constraints, hoặc trade-off của dự án để tôi có thể học từ cách bạn lập luận.
- Không được gắn `recommended` một cách chung chung hoặc theo mặc định; nếu chưa đủ context để recommend tốt, phải tự đọc thêm context trước rồi mới hỏi.
- Nếu chưa có codebase hoặc context đủ để recommend, hãy chọn phương án có `blast radius` nhỏ nhất và `migration cost` thấp nhất, rồi nói rõ đây là `conservative default`.
```

**Modified (add one line at end):**
```markdown
- Khi đưa lựa chọn, luôn phải có ít nhất 1 option `recommended` do chính bạn chọn là phù hợp nhất với codebase hoặc dự án hiện tại.
- Mỗi option `recommended` phải kèm giải thích ngắn gọn vì sao bạn chọn nó, dựa trên codebase, pattern hiện có, constraints, hoặc trade-off của dự án để tôi có thể học từ cách bạn lập luận.
- Không được gắn `recommended` một cách chung chung hoặc theo mặc định; nếu chưa đủ context để recommend tốt, phải tự đọc thêm context trước rồi mới hỏi.
- Nếu chưa có codebase hoặc context đủ để recommend, hãy chọn phương án có `blast radius` nhỏ nhất và `migration cost` thấp nhất, rồi nói rõ đây là `conservative default`.
- **CHÚ Ý:** Xem "Preflight Check cho Câu Hỏi Multiple-Choice" ở trên để biết cách tự kiểm tra và tự sửa trước khi hiển thị câu hỏi.
```

**Rationale:**
- Keep existing rules (describe "what" and "why")
- Preflight section describes "how" and "when"
- Link creates clear connection between sections

### Data Flow

```
┌─────────────────────────────────────┐
│ AI About to Ask Question            │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│ Is it multiple-choice (2+ options)? │
└───────────┬──────────────┬──────────┘
            │ No           │ Yes
            │              ▼
            │    ┌─────────────────────┐
            │    │ Preflight Check:    │
            │    │ 1. Has recommended? │
            │    │ 2. Has explanation? │
            │    │ 3. Quality check?   │
            │    └──────────┬──────────┘
            │               │
            │        ┌──────┴──────┐
            │        │ All Pass?   │
            │        └──────┬──────┘
            │        ┌──────┴──────┐
            │        │ Yes    │ No │
            │        │        │    │
            │        │        ▼    │
            │        │  ┌─────────────────┐
            │        │  │ Auto-Fix:       │
            │        │  │ Add recommended │
            │        │  │ Add explanation │
            │        │  └────────┬────────┘
            │        │           │
            ▼        ▼           ▼
┌─────────────────────────────────────┐
│ Display Question to User            │
└─────────────────────────────────────┘
```

**Key Points:**
- Check happens BEFORE display
- User never sees violations
- Non-multiple-choice questions skip preflight

### Cross-Platform Implementation

**Files to Modify:**

| File | Insert Location | Modify Location |
|------|----------------|-----------------|
| `packages/templates/interview/cursor.md` | Line 64 (before "## Cách phỏng vấn") | Lines 78-81 → add link line |
| `packages/templates/interview/claude.md` | Line 74 (before "## Cách phỏng vấn") | Lines 87-90 → add link line |
| `packages/templates/interview/copilot.md` | Line 71 (before "## Cách phỏng vấn") | Lines 84-87 → add link line |
| `packages/templates/interview/codex/SKILL.md` | After line 30 (before "## Phase 2: Deep Dive") | In-line with methodology |

**Strategy:**
1. Identical preflight content across all 4 files
2. Only metadata headers differ (description, tool name)
3. Vietnamese language throughout (matching existing style)
4. No platform-specific customizations

**Validation Steps:**
1. Implement in all 4 templates
2. Run diff check to verify identical content
3. Test on one platform (e.g., Cursor) to verify behavior
4. User validates consistency across platforms

## Testing Strategy

### Manual Testing

**Test Case 1: Multiple-Choice with Codebase Context**
- **Input:** Run `/interview` on project with existing patterns
- **Expected:** AI asks multiple-choice, includes recommended based on actual codebase patterns with specific explanation
- **Verification:** Check that explanation references actual files/patterns

**Test Case 2: Multiple-Choice without Codebase Context**
- **Input:** Run `/interview` on empty/greenfield project
- **Expected:** AI asks multiple-choice, includes recommended with "conservative default" explanation
- **Verification:** Check that it mentions "blast radius nhỏ nhất" or "migration cost thấp nhất"

**Test Case 3: Yes/No Question**
- **Input:** AI asks yes/no question
- **Expected:** Preflight check skipped, no recommended required
- **Verification:** Yes/no question displayed normally

**Test Case 4: Open-Ended Question**
- **Input:** AI asks text input question
- **Expected:** Preflight check skipped, no recommended required
- **Verification:** Open-ended question displayed normally

### Cross-Platform Validation

Run identical test on all 4 platforms:
1. Cursor (`.cursor/commands/interview.md`)
2. Claude Code (`.claude/commands/interview.md`)
3. Copilot (`.github/prompts/interview.prompt.md`)
4. Codex (`.agents/skills/interview/SKILL.md`)

**Success Criteria:** Identical behavior across all platforms without manual prompt modifications.

## Rollout Strategy

1. **Implementation Phase:**
   - Update all 4 template files
   - Verify diff shows only intended changes
   - Commit changes

2. **Testing Phase:**
   - User tests on primary platform (Cursor)
   - Verify recommended + explanation appear automatically
   - User tests on other 3 platforms
   - Confirm consistency

3. **Monitoring Phase:**
   - User runs multiple interview sessions
   - Document any edge cases where constraint fails
   - Iterate if needed

## Risks and Trade-Offs

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| AI still skips preflight check | Medium | Structural gate placement makes this unlikely; if occurs, add redundant checks |
| Explanation quality degrades | Low | Example provided shows expected quality; 3-point checklist enforces standards |
| Platform-specific prompt processing differences | Low | Using identical wording minimizes this; can investigate per-platform if issue arises |

### Trade-Offs

| Trade-Off | Decision | Rationale |
|-----------|----------|-----------|
| Flexibility vs. Consistency | Chose Consistency | User explicitly wants guaranteed behavior across platforms |
| Brevity vs. Clarity | Chose Clarity | Longer preflight section, but structural clarity reduces ambiguity |
| Auto-fix vs. Report Error | Chose Auto-fix | Better UX; user doesn't want to see violations |

## Open Risks

None at this time. All material ambiguity resolved during brainstorming.

## Explicit Decisions Made

| Decision | Status | Provenance | Risk | Notes |
|----------|--------|------------|------|-------|
| Auto-fix mechanism (not report-error) | Accepted | User-confirmed | Low | User wants seamless experience |
| Concise explanations (1-2 sentences) | Accepted | User-confirmed | Low | Balance between brevity and educational value |
| Multiple-choice only (not all questions) | Accepted | User-confirmed | Low | Recommended only makes sense with multiple options |
| Preflight validation before asking | Accepted | User-confirmed | Low | Proactive prevention over reactive fixing |
| Unified strict wording (100% identical) | Accepted | User-confirmed | Low | User wants consistent experience across platforms |

## Future Scope / Deferred Features

**Not in current scope but could be added later:**
- Metrics tracking: how often auto-fix triggers
- Logging: which questions needed correction
- User preference: adjust explanation length (1-2 vs 2-4 sentences)
- Platform-specific optimizations if needed

## Acceptance Criteria

- [ ] Preflight section exists in all 4 templates
- [ ] Lines 78-81 modified with link to preflight in all 4 templates
- [ ] Diff check confirms identical preflight content across templates
- [ ] User runs `/interview` on Cursor without manual reminders → recommended appears
- [ ] User runs `/interview` on Claude Code without manual reminders → recommended appears
- [ ] User runs `/interview` on Copilot without manual reminders → recommended appears
- [ ] User runs `/interview` on Codex without manual reminders → recommended appears
- [ ] Recommended option includes 1-2 sentence explanation in all cases
- [ ] Explanation references specific context (codebase, patterns, constraints, or conservative default)

## Happy Path

1. User runs `/interview` command
2. AI begins interview process
3. AI prepares multiple-choice question
4. **Before displaying:** AI runs preflight check
5. AI detects: has recommended? has explanation? quality OK?
6. If any check fails: AI auto-fixes NOW
7. AI displays question with recommended + explanation
8. User sees polished question, unaware any fix occurred
9. User selects option and continues interview

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Question with only 1 option | Not multiple-choice, skip preflight |
| Yes/no question | Not multiple-choice, skip preflight |
| Open-ended text input | Not multiple-choice, skip preflight |
| Empty codebase (no context) | Use conservative default fallback (blast radius + migration cost) |
| Conflicting patterns in codebase | AI chooses lowest risk option, explains trade-off in reasoning |

## Failure Cases

| Failure Scenario | Detection | Recovery |
|------------------|-----------|----------|
| AI displays question without recommended | User notices during testing | Add redundant check; increase imperative language strength |
| Explanation too vague or generic | User notices during testing | Add quality examples; strengthen check #3 criteria |
| Different behavior across platforms | User tests all 4 platforms | Investigate platform-specific processing; adjust wording if needed |

---

## Implementation Notes

**Implementation Date:** 2026-04-16  
**Implementation Summary:**
- Added preflight check section to all 4 templates (cursor, claude, copilot, codex)
- Cursor, Claude, Copilot templates now include identical preflight content
- Codex skill file now includes equivalent preflight workflow with the same mandatory checklist and auto-fix behavior
- Link line added to existing recommendation rules in all 4 templates
- Total changes: +36 lines each for cursor, claude, copilot; +23 lines for codex

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

**Design Status:** Implemented
