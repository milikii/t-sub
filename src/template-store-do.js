import { errorResponse, json, methodNotAllowed, readJson } from "./core/http.js";
import { DEFAULT_TEMPLATES, builtInTemplateById, normalizeTemplate, withTemplateTimestamps } from "./core/templates.js";

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
      return json({ error: { type: "NotFound", message: "未找到。" } }, { status: 404 });
    }

    await this.ensureSeeded();

    if (request.method === "GET" && !id) return this.list();
    if (request.method === "GET" && id && !parts[2]) return this.get(id);
    if (request.method === "POST" && id && parts[2] === "reset") return this.reset(id);
    if (request.method === "POST" && !id) return this.save(await readJson(request));
    if (request.method === "PUT" && id && !parts[2]) return this.save({ ...(await readJson(request)), id });
    if (request.method === "DELETE" && id && !parts[2]) return this.delete(id);

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
      const error = new Error("模板不存在。");
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

  async reset(id) {
    const builtIn = builtInTemplateById(id);
    if (!builtIn) {
      const error = new Error("没有这个内置模板。");
      error.name = "NotFoundError";
      error.status = 404;
      throw error;
    }
    const existing = await this.state.storage.get(templateKey(id));
    const template = normalizeTemplate(builtIn, existing);
    await this.state.storage.put(templateKey(template.id), template);
    return json({ template });
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
