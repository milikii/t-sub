import { readFileSync } from "node:fs";

const toml = readFileSync("wrangler.toml", "utf8");
const missing = [];

if (toml.includes("REPLACE_WITH_TEMPLATES_KV_ID") || toml.includes("REPLACE_WITH_TEMPLATES_PREVIEW_KV_ID")) {
  missing.push("KV namespace IDs are still placeholders. Run `npm run cf:setup` first.");
}

if (!toml.includes("new_sqlite_classes = [\"OneTimeConfig\"]")) {
  missing.push("Durable Object migration for OneTimeConfig is missing from wrangler.toml.");
}

if (missing.length) {
  console.error("Cloudflare deploy is not ready:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Cloudflare deploy config check passed.");
