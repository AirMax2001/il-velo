import { useEffect, useState } from "react";
import { apiJson } from "@/services/api";

export function useCampaignResource<T>(url: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    apiJson<T>(url)
      .then(setData)
      .catch(() => setData(fallback))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, setData };
}
