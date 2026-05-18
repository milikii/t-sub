export function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

export function text(data, init = {}) {
  return new Response(data, {
    ...init,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

export function html(data, init = {}) {
  return new Response(data, {
    ...init,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

export function asset(data, contentType) {
  return new Response(data, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600",
    },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON."), { status: 400 });
  }
}

export function errorResponse(error) {
  const status = error.status || statusFromError(error);
  return json(
    {
      error: {
        type: error.name || "Error",
        message: error.message || "Unexpected error.",
        details: error.details || undefined,
      },
    },
    { status },
  );
}

function statusFromError(error) {
  if (error.name === "NodeValidationError" || error.name === "RenderValidationError") {
    return error.details?.length ? 422 : 400;
  }
  if (error.name === "NotFoundError") return 404;
  if (error.name === "UnauthorizedError") return 401;
  return 500;
}

export function notFound() {
  return json({ error: { type: "NotFound", message: "Not found." } }, { status: 404 });
}

export function methodNotAllowed() {
  return json({ error: { type: "MethodNotAllowed", message: "Method not allowed." } }, { status: 405 });
}

