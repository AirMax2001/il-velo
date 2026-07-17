export function emptyText(value: unknown, fallback = "Non definito") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}
