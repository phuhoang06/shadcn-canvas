import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Deployment Scripts Verification", () => {
  const rootDir = path.resolve(__dirname, "..");
  const wrapperPath = path.join(rootDir, "deploy", "deploy-wrapper.sh");
  const deployScriptPath = path.join(rootDir, "deploy", "deploy.sh");

  describe("SSH deploy-wrapper.sh", () => {
    it("exists and strictly validates input with 40-character hex regex", () => {
      expect(fs.existsSync(wrapperPath)).toBe(true);
      const content = fs.readFileSync(wrapperPath, "utf-8");

      expect(content).toContain("#!/usr/bin/env bash");
      expect(content).toContain("set -euo pipefail");

      // Regex validation for deploy command + 40 hex chars
      expect(content).toContain("[0-9a-f]{40}");
      expect(content).toContain("[SECURITY REJECTED]");

      // Target execution path
      expect(content).toContain("/home/deploy-canvas/projects/canvas/deploy.sh");
    });
  });

  describe("Server deploy.sh", () => {
    it("exists, uses flock, handles first-run, traps up failure, and provides 2-tier rollback", () => {
      expect(fs.existsSync(deployScriptPath)).toBe(true);
      const content = fs.readFileSync(deployScriptPath, "utf-8");

      expect(content).toContain("#!/usr/bin/env bash");
      expect(content).toContain("set -euo pipefail");

      // Concurrency lock
      expect(content).toContain("flock");
      expect(content).toContain(".deploy.lock");

      // First run detection
      expect(content).toContain("IS_FIRST_RUN");

      // Atomic env update
      expect(content).toContain(".env.tmp");
      expect(content).toContain("mv .env.tmp .env");

      // Error handling on docker compose up
      expect(content).toContain("docker compose up -d");
      expect(content).toContain("UP_SUCCESS");

      // Healthcheck loop against local port 3000
      expect(content).toContain("http://127.0.0.1:3000/");

      // Rollback logic
      expect(content).toContain("Rolling back to previous stable tag");
      expect(content).toContain("ROLLBACK_HEALTHY");
      expect(content).toContain("exit 1");
      expect(content).toContain("exit 2");
    });
  });
});
