export async function listTemplates(env) {
  const data = await templateStoreRequest(env, "/templates");
  return data.templates;
}

export async function getTemplate(env, id) {
  const data = await templateStoreRequest(env, `/templates/${encodeURIComponent(id)}`);
  return data.template;
}

export async function saveTemplate(env, input) {
  const id = input.id ? `/${encodeURIComponent(input.id)}` : "";
  const data = await templateStoreRequest(env, `/templates${id}`, {
    method: input.id ? "PUT" : "POST",
    body: JSON.stringify(input),
  });
  return data.template;
}

export async function deleteTemplate(env, id) {
  await templateStoreRequest(env, `/templates/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

async function templateStoreRequest(env, path, init = {}) {
  if (!env.TEMPLATE_STORE) {
    throw new Error("TEMPLATE_STORE Durable Object binding is missing.");
  }

  const id = env.TEMPLATE_STORE.idFromName("templates");
  const stub = env.TEMPLATE_STORE.get(id);
  const response = await stub.fetch(`https://template-store${path}`, {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || "Template store request failed.");
    error.name = data.error?.type || "TemplateStoreError";
    error.status = response.status;
    error.details = data.error?.details;
    throw error;
  }

  return data;
}
