import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Production Deployment Artifacts Verification", () => {
  const rootDir = path.resolve(__dirname, "..");

  describe("Dockerfile configuration", () => {
    const dockerfilePath = path.join(rootDir, "Dockerfile");

    it("exists and defines a multi-stage build with Nginx runner", () => {
      expect(fs.existsSync(dockerfilePath)).toBe(true);
      const content = fs.readFileSync(dockerfilePath, "utf-8");

      // Multi-stage builder
      expect(content).toContain("FROM node:24-alpine AS builder");
      expect(content).toContain("RUN npm run build");

      // Runner stage
      expect(content).toContain("FROM nginx:alpine AS runner");
      expect(content).toContain("/usr/share/nginx/html");
      expect(content).toContain("EXPOSE 80");
      expect(content).toContain("http://localhost/");
    });
  });

  describe("Docker Compose configuration (deploy/compose.yaml)", () => {
    const composePath = path.join(rootDir, "deploy", "compose.yaml");

    it("exists and specifies dynamic IMAGE_TAG and local port 3000 mapping", () => {
      expect(fs.existsSync(composePath)).toBe(true);
      const content = fs.readFileSync(composePath, "utf-8");

      // Service definition
      expect(content).toContain("services:");
      expect(content).toContain("shadcn-canvas:");

      // Dynamic image tag
      expect(content).toContain("${IMAGE_TAG}");

      // Port mapping strictly bound to 127.0.0.1:3000
      expect(content).toContain('"127.0.0.1:3000:80"');

      // Healthcheck inside container
      expect(content).toContain("healthcheck:");
      expect(content).toContain("wget");
    });
  });
});
