import { readFileSync } from "node:fs";
import { join } from "node:path";

export function loadFixture<T>(...relativePath: string[]): T {
  const fullPath = join(process.cwd(), "fixtures", ...relativePath);
  const raw = readFileSync(fullPath, "utf-8");
  return JSON.parse(raw) as T;
}

export function loadTextFixture(...relativePath: string[]): string {
  const fullPath = join(process.cwd(), "fixtures", ...relativePath);
  return readFileSync(fullPath, "utf-8");
}
