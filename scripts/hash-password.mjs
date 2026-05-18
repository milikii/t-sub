import { createHash } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const arg = process.argv.slice(2).join(" ");
let password = arg;

if (!password) {
  const rl = createInterface({ input, output });
  password = await rl.question("Password to hash: ");
  rl.close();
}

if (!password || password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const hash = createHash("sha256").update(password, "utf8").digest("hex");
console.log(`sha256:${hash}`);
