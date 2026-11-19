import type { CustomerErrors } from "@/lib/customerValidation";

export default function CustomerValidationSummary({ errors, submitted }: { errors: CustomerErrors; submitted: boolean }) {
  const messages = Object.values(errors).filter(Boolean);
  if (!submitted || !messages.length) return null;
  return <div role="alert" className="text-sm text-red-700">
    <p>Please correct the following:</p>
    <ul className="list-disc pl-5">{messages.map(message => <li key={message}>{message}</li>)}</ul>
  </div>;
}
