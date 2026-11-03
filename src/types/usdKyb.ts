export type KybStatus =
  | "not_started"
  | "collecting"
  | "requires_correction"
  | "awaiting_admin_review"
  | "submitted_to_bridge"
  | "under_review"
  | "awaiting_ubo"
  | "completed"
  | "rejected";
export type KybSection =
  | "identity"
  | "business_details"
  | "owners_directors"
  | "activity"
  | "documents"
  | "review";
export type KybDraft = Record<string, unknown>;
export interface KybPerson {
  associated_person_id?: string;
  business_usd_kyb_associated_person_id?: string;
  person_key: string;
  can_remove?: boolean;
  identifying_information?: {
    type?: string;
    issuing_country?: string;
    number?: string;
    [key: string]: unknown;
  }[];
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  title?: string | null;
  birth_date?: string;
  residential_address?: {
    street_line_1?: string;
    street_line_2?: string;
    city?: string;
    subdivision?: string;
    postal_code?: string;
    country?: string;
    [key: string]: string | undefined;
  };
  nationalities?: string[];
  place_of_birth?: { country: string } | null;
  relationship_established_at?: string;
  has_ownership?: boolean;
  ownership_percentage?: number | null;
  has_control?: boolean;
  is_signer?: boolean;
  is_director?: boolean;
  verification_status?: string | null;
  verification_started_at?: string | null;
  verified_at?: string | null;
  invitation_status?: string;
  invitation_expires_at?: string | null;
  [key: string]: unknown;
}
export interface KybDocument {
  business_usd_kyb_document_id: string;
  document_id?: string;
  associated_person_id: string | null;
  file_url: `s3://${string}`;
  file_name: string | null;
  purposes: string[];
  content_type: string | null;
  file_size: number | null;
  description: string | null;
  [key: string]: unknown;
}
export interface KybFieldError {
  field: string;
  message: string;
  placeholder?: string;
  source?: "local" | "bridge";
  associated_person_id?: string;
}
export interface KybValidation {
  field_errors?: KybFieldError[];
  is_complete: boolean;
  missing_requirements: string[];
  validated_at?: string;
}
export interface CompanyDifference {
  field: string;
  current: unknown;
  provider: unknown;
}
export interface KybCase {
  business_usd_kyb_case_id: string;
  payload_version: number;
  status: KybStatus;
  business_name?: string | null;
  draft_payload: KybDraft;
  requested_changes: unknown[];
  review_note?: string | null;
  failure_reason?: string | null;
  submitted_for_review_at?: string | null;
  youverify_lookup_differences?: CompanyDifference[];
  [key: string]: unknown;
}
export interface KybBundle {
  draft_payload?: KybDraft;
  case: KybCase;
  prefilled_draft: KybDraft;
  associated_persons: KybPerson[];
  documents: KybDocument[];
  requested_corrections: unknown[];
  completion: {
    sections: Record<KybSection, { complete: boolean }>;
    complete_sections: number;
    total_sections: number;
  };
  validation: KybValidation;
  payload_version: number;
  review_blockers?: string[];
}
export interface KybMutation {
  removed_document_ids?: string[];
  case: KybCase;
  associated_persons: KybPerson[];
  validation: KybValidation;
}
export interface KybPatch {
  expected_version: number;
  draft_payload: KybDraft;
  associated_persons?: KybPerson[];
}
export interface LookupResult {
  lookup: Record<string, unknown>;
  differences: CompanyDifference[];
  cached: boolean;
  case: KybCase;
}
export interface UploadTarget {
  upload_url: string;
  file_url: `s3://${string}`;
  method: "PUT";
  required_headers: Record<string, string>;
  max_file_size: number;
  content_type: string;
}
export interface PersonInvitation {
  associated_person_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  verification_status: string | null;
  expires_at: string | null;
  verified_at: string | null;
}
export interface IdentitySession {
  session_id: string;
  session_token?: string | null;
  url?: string | null;
  status: string;
  workflow_id: string | null;
}
export interface KybFormGuide {
  business_types?: unknown;
  endorsements?: unknown;
  required_bridge_fields?: unknown;
  document_purposes?: unknown;
  [key: string]: unknown;
}
