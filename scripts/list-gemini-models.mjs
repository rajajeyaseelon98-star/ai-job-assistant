/**
 * List Gemini models available for your API key.
 * Run: node scripts/list-gemini-models.mjs
 * (Reads GEMINI_API_KEY from .env.local or environment.)
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local if dotenv didn't (Next.js project often uses .env.local)
function loadEnvLocal() {
  const path = join(__dirname, "..", ".env.local");
  if (existsSync(path)) {
    const content = readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnvLocal();

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  console.error("Set GEMINI_API_KEY in .env.local or environment.");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

try {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    console.error("Error:", data.error || res.status);
    process.exit(1);
  }
  console.log("Available models (name):\n");
  const models = data.models || [];
  for (const m of models) {
    const name = m.name?.replace("models/", "") || m.name;
    console.log("  ", name);
  }
  console.log("\nTotal:", models.length);
} catch (e) {
  console.error(e);
  process.exit(1);
}
