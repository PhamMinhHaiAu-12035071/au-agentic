export interface CliArgs {
  mode: "smoke" | "matrix";
  model?: string;
  runs?: number;
  fixture?: string;
  real: boolean;
  help: boolean;
}

export const HELP_TEXT = `cursor-agent-bench — skill-harness benchmark runner

Usage:
  bun run src/index.ts [flags]

Flags:
  --matrix              Run full model matrix (default: smoke, single model)
  --model <id>          Override model id (smoke mode only; default from config)
  --runs <N>            Override runs per cell (positive integer)
  --fixture <id>        Run a single fixture by id (default: all fixtures)
  --real                Actually invoke cursor-agent CLI (omit for dry-run scaffolding)
  --help, -h            Show this help and exit

Exit codes:
  0  all turns pass
  1  at least one turn failed
  2  preflight failure (binary missing / not logged in)
  4  usage error (bad flags / fixture load)
`;

function requireNext(flag: string, argv: string[], i: number): string {
  const next = argv[i + 1];
  if (next === undefined) throw new Error(`flag ${flag} requires a value`);
  return next;
}

export function parseCliArgs(argv: string[]): CliArgs {
  const out: CliArgs = { mode: "smoke", real: false, help: false };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === undefined) continue;
    switch (a) {
      case "--matrix":
        out.mode = "matrix";
        break;
      case "--real":
        out.real = true;
        break;
      case "--help":
      case "-h":
        out.help = true;
        break;
      case "--model":
        out.model = requireNext(a, argv, i);
        i++;
        break;
      case "--runs": {
        const raw = requireNext(a, argv, i);
        i++;
        if (!/^\d+$/.test(raw)) {
          throw new Error(`--runs expects positive integer, got: ${raw}`);
        }
        const n = Number.parseInt(raw, 10);
        if (!Number.isFinite(n) || n <= 0) {
          throw new Error(`--runs expects positive integer, got: ${raw}`);
        }
        out.runs = n;
        break;
      }
      case "--fixture":
        out.fixture = requireNext(a, argv, i);
        i++;
        break;
      default:
        throw new Error(`unknown flag: ${a}`);
    }
  }

  return out;
}
