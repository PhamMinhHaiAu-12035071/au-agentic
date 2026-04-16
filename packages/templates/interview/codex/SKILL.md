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

## Phase 2: Deep Dive

Cover: technical implementation, UI/UX, data model, business rules, edge cases, error handling, testing, rollout, security, performance, trade-offs.

## Question Rules

- Ask **1 question per turn**, highest leverage first
- Use numbered choices: `1. Option A  2. Option B (Recommended)`
- Mark recommended option clearly with `(Recommended)` label
- **CHÚ Ý:** Xem "Preflight Check cho Câu Hỏi Multiple-Choice" ở trên để biết cách tự kiểm tra và tự sửa trước khi hiển thị câu hỏi.
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
