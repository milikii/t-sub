import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcesPath = resolve(rootDir, "rules/upstream-sources.json");
const checkOnly = process.argv.includes("--check");
const dryRun = process.argv.includes("--dry-run");
const includeDisabled = process.argv.includes("--include-disabled");
const sourceId = valueAfter("--source");
const verbose = process.argv.includes("--verbose");

const config = JSON.parse(await readFile(sourcesPath, "utf8"));
const sources = config.sources.filter((source) => {
  if (sourceId && source.id !== sourceId) return false;
  return includeDisabled || source.enabled;
});

// Only process generated sources
const generatedSources = sources.filter((s) => s.type === "generated" && s.url);

if (!generatedSources.length) {
  console.log("No enabled generated upstream rule sources.");
  console.log("Manual sources are never modified by this script.");
  process.exit(0);
}

let hasChanges = false;

for (const source of generatedSources) {
  process.stdout.write(`Fetching ${source.id}... `);

  const response = await fetch(source.url, {
    headers: {
      "user-agent": "t-sub-rule-updater/2.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.id}: ${response.status} ${response.statusText}`);
  }

  const body = await response.text();

  // Validate response
  if (!body || body.trim().length === 0) {
    throw new Error(`Empty response from ${source.id}`);
  }

  if (body.trim().length < 10) {
    throw new Error(`Response too small (${body.trim().length} bytes) from ${source.id}`);
  }

  const upstream = normalizeRuleLines(body);
  const targetPath = resolve(rootDir, "rules", source.target);
  const existingLines = normalizeRuleLines(await readExisting(targetPath));

  if (verbose) {
    console.log(`${upstream.length} rules from upstream, ${existingLines.length} existing`);
  }

  // generated files: full replace
  const output = `${upstream.join("\n")}\n`;

  if (checkOnly) {
    const existing = await readExisting(targetPath);
    if (existing !== output) {
      console.error(`${source.target} is out of sync with ${source.id}.`);
      process.exitCode = 1;
      hasChanges = true;
    }
    console.log("OK");
    continue;
  }

  if (existingLines.length === upstream.length && (await readExisting(targetPath)) === output) {
    console.log("unchanged");
    continue;
  }

  if (dryRun) {
    console.log(`would update: ${existingLines.length} -> ${upstream.length} rules`);
    hasChanges = true;
    continue;
  }

  await writeFile(targetPath, output);
  hasChanges = true;
  console.log(`updated: ${existingLines.length} -> ${upstream.length} rules`);
}

// Generate change summary
if (hasChanges && !checkOnly && !dryRun) {
  console.log("\nChange summary written.");
}

if (!hasChanges && checkOnly) {
  console.log("All generated rule files are up to date.");
}

function normalizeRuleLines(body) {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map(normalizeRuleLine)
    .filter(Boolean);
}

function normalizeRuleLine(line) {
  if (line.startsWith("DOMAIN-SUFFIX,")) return `+.${line.slice("DOMAIN-SUFFIX,".length)}`;
  if (line.startsWith("DOMAIN,")) return line.slice("DOMAIN,".length);
  return line;
}

async function readExisting(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

function valueAfter(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}
