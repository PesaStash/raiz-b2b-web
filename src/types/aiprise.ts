import type { DetailedHTMLProps, HTMLAttributes } from "react";

type AipriseFrameAttributes = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  mode?: "SANDBOX" | "PRODUCTION";
  "template-id"?: string;
  "session-id"?: string;
  "callback-url"?: string;
  "events-callback-url"?: string;
  "client-reference-id"?: string;
  "client-reference-data"?: string;
  "user-profile-id"?: string;
  "business-profile-id"?: string;
  "user-data"?: string;
  "business-data"?: string;
  "additional-info"?: string;
  "ui-options"?: string;
  "verification-options"?: string;
  "associated-email"?: string;
  icon?: string;
  theme?: string;
  title?: string;
  color?: string;
  "text-color"?: string;
};

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "aiprise-frame": AipriseFrameAttributes;
        "aiprise-button": AipriseFrameAttributes;
      }
    }
  }
}

export {};
