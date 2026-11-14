import { z } from "zod";

/** Matches the deployed line-item schema without accepting fractional quantities or zero prices. */
export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().finite().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
  unitPrice: z.number().finite().min(1, "Unit price must be at least 1"),
});
