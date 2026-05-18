export function yamlScalar(value) {
  if (value === true || value === false) return String(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value == null) return "null";
  return JSON.stringify(String(value));
}

export function objectToYaml(value, indent = 0) {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;
    return value
      .map((item) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const entries = Object.entries(item).filter(([, entryValue]) => entryValue !== undefined && entryValue !== "");
          if (entries.length === 0) return `${pad}- {}`;
          const [[firstKey, firstValue], ...rest] = entries;
          const first = yamlEntry(firstKey, firstValue, 0);
          const other = rest.map(([key, entryValue]) => yamlEntry(key, entryValue, indent + 2)).join("\n");
          return other ? `${pad}- ${first}\n${other}` : `${pad}- ${first}`;
        }
        return `${pad}- ${yamlScalar(item)}`;
      })
      .join("\n");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, item]) => item !== undefined && item !== "")
      .map(([key, item]) => {
        if (Array.isArray(item)) {
          if (item.length === 0) return `${pad}${key}: []`;
          return `${pad}${key}:\n${objectToYaml(item, indent + 2)}`;
        }
        if (item && typeof item === "object") {
          return `${pad}${key}:\n${objectToYaml(item, indent + 2)}`;
        }
        return `${pad}${key}: ${yamlScalar(item)}`;
      })
      .join("\n");
  }

  return `${pad}${yamlScalar(value)}`;
}

function yamlEntry(key, value, indent) {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}${key}: []`;
    return `${pad}${key}:\n${objectToYaml(value, indent + 2)}`;
  }
  if (value && typeof value === "object") {
    return `${pad}${key}:\n${objectToYaml(value, indent + 2)}`;
  }
  return `${pad}${key}: ${yamlScalar(value)}`;
}

export function indentLines(value, spaces) {
  const pad = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => (line ? `${pad}${line}` : line))
    .join("\n");
}
