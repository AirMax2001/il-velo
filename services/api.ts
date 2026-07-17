export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok || data.error) {
    throw new Error(data.error || "Richiesta non riuscita");
  }

  return data;
}
