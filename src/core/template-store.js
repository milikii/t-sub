import { DEFAULT_TEMPLATES, normalizeTemplate, withTemplateTimestamps } from "./templates.js";

const TEMPLATE_PREFIX = "template:";
const SEEDED_KEY = "templates:seeded:v1";

export async function listTemplates(env) {
  await ensureSeeded(env);
  const list = await env.TEMPLATES.list({ prefix: TEMPLATE_PREFIX });
  const records = await Promise.all(
    list.keys.map(async (key) => JSON.parse(await env.TEMPLATES.get(key.name))),
  );
  return records.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTemplate(env, id) {
  await ensureSeeded(env);
  const raw = await env.TEMPLATES.get(templateKey(id));
  if (!raw) {
    const error = new Error("Template not found.");
    error.name = "NotFoundError";
    throw error;
  }
  return JSON.parse(raw);
}

export async function saveTemplate(env, input) {
  await ensureSeeded(env);
  const existingRaw = input.id ? await env.TEMPLATES.get(templateKey(input.id)) : null;
  const existing = existingRaw ? JSON.parse(existingRaw) : null;
  const template = normalizeTemplate(input, existing);
  await env.TEMPLATES.put(templateKey(template.id), JSON.stringify(template));
  return template;
}

export async function deleteTemplate(env, id) {
  await ensureSeeded(env);
  await env.TEMPLATES.delete(templateKey(id));
}

async function ensureSeeded(env) {
  if (!env.TEMPLATES) throw new Error("TEMPLATES KV binding is missing.");
  if (await env.TEMPLATES.get(SEEDED_KEY)) return;
  const now = new Date().toISOString();
  await Promise.all(
    DEFAULT_TEMPLATES.map((template) =>
      env.TEMPLATES.put(
        templateKey(template.id),
        JSON.stringify(withTemplateTimestamps({ ...template, createdAt: now, updatedAt: now })),
      ),
    ),
  );
  await env.TEMPLATES.put(SEEDED_KEY, now);
}

function templateKey(id) {
  return `${TEMPLATE_PREFIX}${id}`;
}

