import { z } from "zod";

// ABA routing checksum: 3/7/1 weights over the nine digits, sum divisible by 10.
export function isRoutingNumber(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  const d = [...value].map(Number);
  const sum =
    3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
  return sum % 10 === 0;
}

// RapidAPI returns a list of `{ status, data: { name, … } }`. The first name is the bank.
const lookupSchema = z.array(
  z.object({
    status: z.string().nullish(),
    data: z.object({ name: z.string().nullish() }).nullish(),
  }),
);

export class RoutingLookupError extends Error {}

/** The bank's name, or null when the number isn't known. Throws when the body isn't the expected list. */
export function bankNameFromLookup(body: unknown): string | null {
  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) throw new RoutingLookupError("Unexpected lookup answer");
  const name = parsed.data[0]?.data?.name?.trim();
  return name ? name : null;
}
