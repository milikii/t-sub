import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const WRANGLER = process.platform === "win32" ? "npx.cmd" : "npx";

function run(args) {
  return execFileSync(WRANGLER, ["wrangler", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

function createKv(preview = false) {
  const args = ["kv", "namespace", "create", "TEMPLATES"];
  if (preview) args.push("--preview");
  const output = run(args);
  const id = output.match(/id\s*=\s*"([^"]+)"/)?.[1];
  if (!id) {
    console.error(output);
    throw new Error("Could not parse KV namespace id from wrangler output.");
  }
  return id;
}

const file = "wrangler.toml";
const currentToml = readFileSync(file, "utf8");
if (!currentToml.includes("REPLACE_WITH_TEMPLATES_KV_ID") || !currentToml.includes("REPLACE_WITH_TEMPLATES_PREVIEW_KV_ID")) {
  throw new Error("wrangler.toml no longer contains both KV placeholders. Update it manually or restore the placeholders before rerunning.");
}

const productionId = createKv(false);
const previewId = createKv(true);
const toml = currentToml
  .replace('id = "REPLACE_WITH_TEMPLATES_KV_ID"', `id = "${productionId}"`)
  .replace('preview_id = "REPLACE_WITH_TEMPLATES_PREVIEW_KV_ID"', `preview_id = "${previewId}"`);

writeFileSync(file, toml);

console.log("Cloudflare KV namespaces configured in wrangler.toml.");
console.log("Next:");
console.log("  npm run hash-password -- \"your password\"");
console.log("  npx wrangler secret put OWNER_PASSWORD_HASH");
console.log("  npx wrangler secret put SESSION_SECRET");
console.log("  npm run deploy");
