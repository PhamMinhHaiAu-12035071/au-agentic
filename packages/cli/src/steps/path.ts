import * as p from "@clack/prompts";
import { hasWritePermission, isDirectory } from "#utils/files";
import { resolvePath } from "#utils/paths";

export async function stepInputPath(): Promise<string> {
  while (true) {
    const input = await p.text({
      message: "Where is your project?",
      placeholder: "/Users/you/my-project",
    });

    if (p.isCancel(input)) {
      p.cancel("Cancelled — no files were modified");
      process.exit(1);
    }

    const raw = (input as string).trim();

    if (!raw) {
      p.log.error("Please enter a project path.");
      continue;
    }

    const resolved = resolvePath(raw);

    if (!(await isDirectory(resolved))) {
      p.log.error(`Directory not found: ${resolved}`);
      continue;
    }

    if (!(await hasWritePermission(resolved))) {
      p.log.error(`No write permission: ${resolved}`);
      continue;
    }

    p.log.success(`Valid directory: ${resolved}`);
    return resolved;
  }
}
