import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("GitLab CI/CD Pipeline Configuration (.gitlab-ci.yml)", () => {
  const rootDir = path.resolve(__dirname, "..");
  const ciPath = path.join(rootDir, ".gitlab-ci.yml");

  it("exists and defines the 3 required stages in correct order", () => {
    expect(fs.existsSync(ciPath)).toBe(true);
    const content = fs.readFileSync(ciPath, "utf-8");

    expect(content).toContain("stages:");
    expect(content).toContain("- test");
    expect(content).toContain("- build");
    expect(content).toContain("- deploy");
  });

  it("requires npm run build in the test stage", () => {
    const content = fs.readFileSync(ciPath, "utf-8");
    expect(content).toContain("npm run typecheck");
    expect(content).toContain("npx vitest run");
    expect(content).toContain("npm run build");
  });

  it("uses full commit SHA tag in build stage with Kaniko builder", () => {
    const content = fs.readFileSync(ciPath, "utf-8");
    expect(content).toContain("$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA");
    expect(content).toContain("kaniko-project/executor");
    expect(content).toContain("--destination");
  });

  it("configures concurrency resource_group and calls deploy wrapper in deploy stage", () => {
    const content = fs.readFileSync(ciPath, "utf-8");
    expect(content).toContain("resource_group: production-canvas");
    expect(content).toContain('deploy ${CI_COMMIT_SHA}');
    expect(content).toContain("SSH_KNOWN_HOSTS");
    expect(content).toContain("SSH_PRIVATE_KEY");
  });

  it("has valid basic YAML structure without tab indentations", () => {
    const content = fs.readFileSync(ciPath, "utf-8");
    // YAML forbids tabs for indentation
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      expect(lines[i].startsWith("\t")).toBe(false);
    }
  });
});
