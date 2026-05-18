import { errorResponse, json, methodNotAllowed, readJson } from "./core/http.js";
import { DEFAULT_TEMPLATES, normalizeTemplate, withTemplateTimestamps } from "./core/templates.js";

const TEMPLATE_PREFIX = "template:";
const SEEDED_KEY = "templates:seeded:v1";

export class TemplateStore {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    try {
      return await this.route(request);
    } catch (error) {
      return errorResponse(error);
    }
  }

  async route(request) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[1] ? decodeURIComponent(parts[1]) : "";

    if (parts[0] !== "templates") {
      return json({ error: { type: "NotFound", message: "Not found." } }, { status: 404 });
    }

    await this.ensureSeeded();

    if (request.method === "GET" && !id) return this.list();
    if (request.method === "GET" && id) return this.get(id);
    if (request.method === "POST" && !id) return this.save(await readJson(request));
    if (request.method === "PUT" && id) return this.save({ ...(await readJson(request)), id });
    if (request.method === "DELETE" && id) return this.delete(id);

    return methodNotAllowed();
  }

  async list() {
    const records = await this.state.storage.list({ prefix: TEMPLATE_PREFIX });
    return json({
      templates: [...records.values()].sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  async get(id) {
    const template = await this.state.storage.get(templateKey(id));
    if (!template) {
      const error = new Error("Template not found.");
      error.name = "NotFoundError";
      error.status = 404;
      throw error;
    }
    return json({ template });
  }

  async save(input) {
    const existing = input.id ? await this.state.storage.get(templateKey(input.id)) : null;
    const template = normalizeTemplate(input, existing);
    await this.state.storage.put(templateKey(template.id), template);
    return json({ template });
  }

  async delete(id) {
    await this.state.storage.delete(templateKey(id));
    return json({ ok: true });
  }

  async ensureSeeded() {
    if (await this.state.storage.get(SEEDED_KEY)) return;
    const now = new Date().toISOString();
    await Promise.all(
      DEFAULT_TEMPLATES.map((template) =>
        this.state.storage.put(
          templateKey(template.id),
          withTemplateTimestamps({ ...template, createdAt: now, updatedAt: now }),
        ),
      ),
    );
    await this.state.storage.put(SEEDED_KEY, now);
  }
}

function templateKey(id) {
  return `${TEMPLATE_PREFIX}${id}`;
}
