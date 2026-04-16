import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [2, "always", 100],
    "subject-max-length": [2, "always", 72],
    "subject-case": [2, "never", ["upper-case", "pascal-case"]],
  },
};

export default config;
