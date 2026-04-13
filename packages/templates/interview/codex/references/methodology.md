# Interview Methodology

Full methodology for the requirement interview process. Referenced from SKILL.md.

## Tiêu chuẩn làm việc

- Mặc định ưu tiên hỏi thừa hơn hỏi thiếu nếu điều đó giúp loại bỏ ambiguity quan trọng.
- `Ambiguity` là `material` nếu câu trả lời khác nhau của nó có thể làm thay đổi scope, data model, API contract, UX flow, auth model, deployment strategy, test strategy, risk profile, hoặc effort/migration cost một cách đáng kể.
- Coi mọi giả định có thể làm thay đổi scope, hành vi, kiến trúc, UX, dữ liệu, test, rollout, vận hành, bảo mật, hiệu năng, hoặc trade-off là `chưa rõ` cho tới khi đã được khóa.
- Không được dừng khi vẫn còn bất kỳ câu hỏi nào mà câu trả lời của nó có thể làm đổi spec, đổi quyết định kỹ thuật, hoặc đổi cách triển khai.
- Không hỏi những gì có thể tự suy ra nhanh và an toàn từ codebase, config, docs, hoặc pattern hiện có; phải tự kiểm tra trước.
- Một nhánh được coi là `đủ rõ` khi: (a) có thể viết pseudo-code, mock data, acceptance criteria, hoặc contract cho nó mà không cần đoán; hoặc (b) câu hỏi tiếp theo của nhánh đó không còn làm thay đổi quyết định kỹ thuật hay sản phẩm nào đã chốt.

## Preflight trước mỗi lượt

- Nếu user cung cấp context từ session trước (working spec snapshot, unresolved ledger, decision log, coverage matrix), hãy render lại và xác nhận trước khi tiếp tục.
- Nếu user nói context cũ lỗi thời: hỏi (a) bắt đầu lại hoàn toàn hay (b) giữ lại phần nào.
- Khi bắt đầu session mới và user chưa cung cấp requirement rõ ràng, hãy mở đầu bằng đúng 1 câu hỏi mời mô tả yêu cầu. Không hỏi gì khác ở lượt này.

## Sổ theo dõi bắt buộc

Duy trì:
- `unresolved ledger`: open questions, open decisions, assumptions needing confirmation, possible conflicts
- `decision log`: [DEC-###] Decision | Status | Provenance | Risk | Notes
- `working spec snapshot`: Goal | Actors | Core flows | Constraints | Open
- `coverage matrix`: Domain | Status | Last Updated
- `scope boundary log`, `scope extension backlog`

Status hợp lệ: `proposed`, `accepted`, `assumed-pending`, `ai-recommended-pending-confirmation`, `superseded`, `rejected`

## Cách phỏng vấn

**Pha 1** — Khóa: `objective`, `definition of done`, `scope`, `non-goals`, `constraints`, `environment`, `dependencies`, `risk/safety`.
Chỉ sang Pha 2 khi cả 8 mục đều có entry `accepted` trong decision log.

**Pha 2** — Đào sâu: technical implementation, UI/UX, data model, business rules, edge cases, error handling, state transitions, testing, rollout, observability, performance, security, migration, backward compatibility, failure modes, trade-offs.

Quy tắc câu hỏi:
- Ưu tiên multiple-choice. Mỗi lượt chỉ hỏi 1 câu quan trọng nhất.
- Khi đưa lựa chọn, trình bày dạng `1. Option A, 2. Option B`. Luôn có option `recommended`.
- Đặt `recommended` nổi bật trước danh sách, kèm lý do ngắn gọn.
- Exception duy nhất: gộp tối đa 3 câu nếu cả 3 đều yes/no/multiple-choice, cùng phục vụ 1 quyết định, và tách ra vô nghĩa.

## Coverage bắt buộc

Xác định ngay đầu các miền liên quan: CLI, backend/API, frontend/web, mobile/app, native, desktop, cloud/infrastructure, terraform/IaC, data/storage, CI/CD, security/compliance, analytics/telemetry, DX/tooling.

Với mỗi miền có liên quan, phải đào sâu tới khi rõ ràng. Với miền không liên quan, tự xác nhận là `out of scope`.

## Điều kiện dừng

Chỉ kết thúc khi:
- Không còn material ambiguity
- Unresolved ledger rỗng
- Coverage matrix không còn `unseen` hoặc `in-progress`
- Một người khác có thể plan/implement mà không cần đoán

## Closing Sequence

1. Batch-confirm tất cả `assumed-pending` items
2. Batch-confirm tất cả `ai-recommended-pending-confirmation` items
3. Hiển thị coverage matrix — hỏi có domain nào cần xem lại không
4. Trình bày canonical spec snapshot — xác nhận lần cuối
5. Ghi spec ra file (fallback chain: SPEC.md → docs/spec.md → specs/[feature]-spec.md)
