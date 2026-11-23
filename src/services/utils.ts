import { AuthAxios } from "@/lib/authAxios";
import { ICountry } from "@/types/misc";

export const FetchCountriesWithIdApi = async (
  country_id: string | null,
): Promise<ICountry> => {
  const response = await AuthAxios.get(`/countries/${country_id}/`);
  return response?.data;
};

/** The bank's name, or null when the number isn't known. Throws when the lookup can't run. */
export async function getBankForRoutingNumber(routingNumber: string): Promise<string | null> {
  const response = await fetch(`/api/routing-number/${encodeURIComponent(routingNumber)}`, {
    headers: { "x-raiz-client": "web" },
  });
  let body: { name?: unknown; message?: unknown } | null = null;
  try {
    body = (await response.json()) as { name?: unknown; message?: unknown };
  } catch {
    body = null;
  }
  if (!response.ok) {
    const message = typeof body?.message === "string" ? body.message : `Lookup failed (${response.status})`;
    throw new Error(message);
  }
  if (body?.name === null) return null;
  if (typeof body?.name === "string") {
    const name = body.name.trim();
    return name ? name : null;
  }
  throw new Error("Unexpected lookup answer");
}
