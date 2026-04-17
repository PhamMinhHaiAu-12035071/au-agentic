import { describe, expect, it } from "bun:test";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { expandTilde, resolvePath, trimTrailingSlash } from "../utils/paths";

describe("expandTilde", () => {
  it("expands ~ to home directory", () => {
    expect(expandTilde("~/projects/foo")).toBe(`${homedir()}/projects/foo`);
  });

  it("expands bare ~ to home directory", () => {
    expect(expandTilde("~")).toBe(homedir());
  });

  it("leaves absolute paths unchanged", () => {
    expect(expandTilde("/Users/dev/project")).toBe("/Users/dev/project");
  });

  it("leaves relative paths unchanged", () => {
    expect(expandTilde("./relative")).toBe("./relative");
  });
});

describe("trimTrailingSlash", () => {
  it("removes single trailing slash", () => {
    expect(trimTrailingSlash("/path/to/dir/")).toBe("/path/to/dir");
  });

  it("removes multiple trailing slashes", () => {
    expect(trimTrailingSlash("/path/to/dir///")).toBe("/path/to/dir");
  });

  it("leaves paths without trailing slash unchanged", () => {
    expect(trimTrailingSlash("/path/to/dir")).toBe("/path/to/dir");
  });
});

describe("resolvePath", () => {
  it("resolves relative path to absolute", () => {
    expect(resolvePath("./src")).toBe(resolve("./src"));
  });

  it("expands tilde and resolves", () => {
    expect(resolvePath("~/foo")).toBe(resolve(`${homedir()}/foo`));
  });

  it("trims trailing slash before resolving", () => {
    expect(resolvePath("/tmp/project/")).toBe("/tmp/project");
  });

  it("trims whitespace", () => {
    expect(resolvePath("  /tmp/project  ")).toBe("/tmp/project");
  });
});
