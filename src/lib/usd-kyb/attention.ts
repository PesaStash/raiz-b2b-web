/** Map grouped backend requirements to an actionable section on the destination step. */
export function attentionSection(key: string) {
  if (key === "signed_agreement_id" || key.endsWith(".signed_agreement_id"))
    return "account-terms";
  if (key === "ownership_structure_attestation_or_document")
    return "ownership_chart";
  if (key === "business_website_or_proof_of_nature_of_business")
    return "proof_of_nature_of_business";
  if (key.startsWith("associated_persons"))
    return key.match(/^associated_persons\[\d+\]/)?.[0] ?? "associated_persons";
  if (key.startsWith("documents")) return "documents";
  return key;
}

export function focusAttention(root: HTMLElement, key: string) {
  const section = attentionSection(key);
  const fields = Array.from(root.querySelectorAll<HTMLElement>("[name]"));
  const field =
    fields.find(
      (el) =>
        el.getAttribute("name") === key && el.getAttribute("type") !== "hidden",
    ) ??
    fields.find(
      (el) =>
        (el.getAttribute("name")?.split(".").at(-1) === key ||
          el.getAttribute("name")?.startsWith(key + ".")) &&
        el.getAttribute("type") !== "hidden",
    );
  const sections = Array.from(
    root.querySelectorAll<HTMLElement>("[data-kyb-requirement]"),
  );
  const target =
    sections.find((el) => el.dataset.kybRequirement === section) ??
    sections.find(
      (el) => el.dataset.kybRequirement?.split(".").at(-1) === key,
    ) ??
    field ??
    root.querySelector<HTMLElement>("h1");
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  const control = target.matches(
    "input:not([type=hidden]), select, textarea, button, a[href]",
  )
    ? target
    : target.querySelector<HTMLElement>(
        "button:not(:disabled), input:not(:disabled):not([type=hidden]), select:not(:disabled), textarea:not(:disabled), a[href]",
      );
  if (!control && !target.hasAttribute("tabindex")) target.tabIndex = -1;
  (control ?? target).focus({ preventScroll: true });
}
