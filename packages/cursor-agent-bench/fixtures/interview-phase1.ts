import type { Fixture } from "#src/types";

const fixture: Fixture = {
  id: "interview-phase1",
  skill: "interview",
  description:
    "Verify interview skill locks Phase 1 items (objective, DoD, scope) with recommended option + explanation",
  maxTurns: 6,
  turns: [
    {
      prompt:
        "Activate the interview skill. I want to add a dark-mode toggle to a CLI wizard. Begin the interview.",
      assertions: [
        {
          kind: "regex",
          pattern: /objective|what.+trying to build|requirement/i,
          description: "asks for objective or requirement",
        },
      ],
    },
    {
      prompt:
        "Objective: let users persist a preferred color scheme (light / dark / auto) across sessions. DoD: flag saved to config, honored on next boot, covered by tests.",
      assertions: [
        {
          kind: "regex",
          pattern: /recommend|option|approach|\boption[s]?\b/i,
          description: "presents options or a recommendation",
        },
        {
          kind: "regex",
          pattern: /why|because|rationale|reason|trade-?off/i,
          description: "explains reasoning",
        },
      ],
    },
    {
      prompt: "Pick option 1 (Recommended).",
      assertions: [
        {
          kind: "regex",
          pattern: /decision|locked|accepted|confirmed|recorded/i,
          description: "records decision",
        },
      ],
    },
    {
      prompt: "Continue the interview.",
      assertions: [
        {
          kind: "regex",
          pattern: /scope|non-goals|constraints|environment/i,
          description: "moves to next Phase 1 item",
        },
      ],
    },
  ],
};

export default fixture;
