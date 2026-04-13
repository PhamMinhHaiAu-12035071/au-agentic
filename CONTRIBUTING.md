# Contributing

## Adding a new slash command

1. Create a new folder under `packages/templates/`:
   ```
   packages/templates/<command-name>/
   ├── cursor.md
   ├── claude.md
   ├── copilot.md
   └── codex/
       └── SKILL.md
   ```

2. Add a version header to each file:
   ```
   <!-- au-agentic v<VERSION> | tool: <TOOL> | generated: <DATE> -->
   ```

3. Update `packages/cli/src/utils/templates.ts`:
   - Add the new template imports
   - Add to `TEMPLATE_MAP` and `TARGET_PATH_MAP`

4. Add manual QA steps to `TESTING.md`

5. Submit a PR with:
   - All 4 template variants
   - Updated `templates.ts`
   - Updated `TESTING.md`
   - Evidence that the command works on at least 2 AI tools

## Template quality checklist

- [ ] Content leverages native features of the tool (e.g., AskUserQuestion for Claude Code)
- [ ] Version header present in all 4 files
- [ ] Content does not reference tool-specific APIs that don't exist
- [ ] Manual QA completed on at least 2 tools
