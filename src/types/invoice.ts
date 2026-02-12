export interface ICustomer {
  full_name: string;
  email: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  country: string;
  business_account_id: string;
  customer_id: string;
  business_name?: string;
  customer_type: "individual" | "business"
}

export interface IInvoice {
  invoice_number: string;
  issue_date: string; // ISO date string (date-time)
  due_date: string; // ISO date string (date-time)
  total_amount: number;
  tax_amount: number | null;
  tax_rate_id: string | null;
  discount_amount: number | null;
  total_discount: number | null;
  total_tax: number | null;
  currency: string; // ≥ 2 characters (e.g. "USD", "NGN")
  customer_id: string; // UUID
  business_account_id: string; // UUID
  attachment_url: string | null;
  terms_and_conditions: string | null;
  status: IInvoiceStatus;
  invoice_id: string; // UUID
  invoice_items: IInvoiceItem[];
  customer: ICustomer;
  note: string;
  created_at?: string;
}

export interface IInvoiceItem {
  description: string | null;
  quantity: number; // > 0
  discount_percent?: number | null;
  discount_amount?: number | null;
  unit_price: number; // ≥ 1
  total_price: number; // ≥ 1
  tax_amount?: number | null;
  tax_rate_id: string | null;
  invoice_id: string; // UUID
  invoice_item_id: string; // UUID
  tax_rate?: ITaxRate | null;
}

export interface ITaxRate {
  tax_percentage: number;
  tax_name: string;
  tax_rate_id: string;
  business_account_id?: number;
}

export interface ICreateInvoicePayload {
  invoice_number: string | null;
  issue_date: string | null; // ISO date string
  due_date: string | null; // ISO date string
  total_amount: number | null;
  tax_amount: number | null;
  tax_rate_id?: string | null;
  discount_amount?: number | null;
  currency: string | null;
  customer_id: string | null;
  attachment_url?: string | null;
  terms_and_conditions: string | null;
  note: string | null;
  invoice_items: {
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export interface IInvoiceLogs {
  activity_type: string;
  activity_description: string;
  invoice_id: string;
  invoice_activity_log_id: string;
  created_at: string;
  updated_at: string;
}

export interface iInvoiceLogsResponse {
  invoice_activity_logs: IInvoiceLogs[];
  pagination: {
    total_results: number;
    current_results_on_page: number;
    current_page: number | null;
    next_page: number | null;
    previous_page: number | null;
    total_pages: number;
  };
}

export type IInvoiceStatus =
  | "pending"
  | "paid"
  | "overdue"
  | "cancelled"
  | "draft"
  | "awaiting_payment";
