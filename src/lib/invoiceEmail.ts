/** Missing links are omitted, allowing invoice-only mail without receiving setup. */
export function invoiceEmailPayload(pdf: string, paymentLink?: string | null) {
  if (!pdf || new TextEncoder().encode(pdf).byteLength > 15_000_000)
    throw new Error("Choose a PDF with encoded content no larger than 15 MB.");
  const link = paymentLink?.trim();
  return { invoice_pdf_url: pdf, ...(link ? { payment_link: link } : {}) };
}
