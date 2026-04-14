**Purpose:** Security rules for handling secrets, tokens, and sensitive configuration  
**Read this when:** Security tasks or auth-sensitive area changes  
**Do not use for:** General coding rules (see coding-rules.md)  
**Related:** SECURITY.md, docs/reference/configuration.md  
**Update when:** Security policies added or sensitive areas identified

---

# Security Policy

## No Hardcoded Tokens

**Rule:** Never commit secrets, API keys, tokens, or passwords to git.

**Use instead:**
- Environment variables for runtime secrets
- `.env` files (add to .gitignore)
- System keychain for local development

**Check before commit:**

```bash
# Check for common secret patterns
rg -i "api[_-]?key|token|password|secret" --type ts

# Check .gitignore includes common secret files
grep -E "\.env|\.secret|credentials\.json" .gitignore
```

## Secrets Handling

**For CLI tool (current repo):**
- CLI doesn't handle secrets currently
- Templates contain no sensitive data
- No API keys or tokens in codebase

**If secrets needed in future:**
- Use environment variables
- Document in docs/reference/configuration.md
- Add validation to reject accidental hardcoding

## Placeholder for Future

**Status:** Currently not applicable — au-agentic is a CLI tool with no secrets handling or sensitive operations.

**Trigger:** This file should be expanded when:
- CLI needs to handle user credentials
- Integration with external APIs added
- Authentication or authorization features added

**Future content should cover:**
- Secrets storage patterns
- Auth/authz model
- Secure communication requirements
- Vulnerability response process
