import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcesPath = resolve(rootDir, "rules/upstream-sources.json");
const checkOnly = process.argv.includes("--check");
const includeDisabled = process.argv.includes("--include-disabled");
const sourceId = valueAfter("--source");

const config = JSON.parse(await readFile(sourcesPath, "utf8"));
const sources = config.sources.filter((source) => {
  if (sourceId && source.id !== sourceId) return false;
  return includeDisabled || source.enabled;
});

if (!sources.length) {
  console.log("No enabled upstream rule sources. Use --include-disabled or enable sources in rules/upstream-sources.json.");
  process.exit(0);
}

for (const source of sources) {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": "t-sub-rule-updater",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.id}: ${response.status} ${response.statusText}`);
  }

  const upstream = normalizeRuleLines(await response.text());
  const targetPath = resolve(rootDir, "rules", source.target);
  const current = normalizeRuleLines(await readExisting(targetPath));
  const merged = mergeLines(current, upstream);
  const output = `${merged.join("\n")}\n`;

  if (checkOnly) {
    const existing = await readExisting(targetPath);
    if (existing !== output) {
      console.error(`${source.target} is out of sync with ${source.id}.`);
      process.exitCode = 1;
    }
    continue;
  }

  await writeFile(targetPath, output);
  console.log(`Updated ${source.target} from ${source.id}: ${current.length} -> ${merged.length} rules.`);
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

function mergeLines(...groups) {
  return [...new Set(groups.flat())].sort((a, b) => a.localeCompare(b));
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
