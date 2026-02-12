import { AuthAxios } from "@/lib/authAxios";
import {
  ICreateInvoicePayload,
  IInvoice,
  iInvoiceLogsResponse,
  IInvoiceStatus,
} from "@/types/invoice";
import {
  IAddCustomerPayload,
  ICreateTaxPayload,
  IFectchInvoiceParams,
  IInvoiceSettingsPayload,
  SendInvoicemailPayload,
} from "@/types/services";

export const FetchInvoiceSettings = async () => {
  const response = await AuthAxios.get("/business/invoice/settings/");
  return response?.data;
};

export const CreateInvoiceSettings = async (
  payload: IInvoiceSettingsPayload
) => {
  const response = await AuthAxios.post("/business/invoice/setings/", payload);
  return response?.data;
};

export const UpdateInvoiceSettings = async () => {
  const response = await AuthAxios.patch("/business/invoice/setings/");
  return response?.data;
};

export const FetchCustomers = async ({
  search,
  page,
  limit,
}: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  if (page) queryParams.append("page", page.toString());
  if (limit) queryParams.append("limit", limit.toString());
  const response = await AuthAxios.get(
    `/business/invoice/customers/?${queryParams.toString()}`
  );

  return response.data;
};

export const AddCustomerApi = async (payload: IAddCustomerPayload) => {
  const response = await AuthAxios.post(
    "/business/invoice/customers/",
    payload
  );
  return response?.data;
};

export const UpdateCustomerApi = async (
  customer_id: string,
  payload: IAddCustomerPayload
) => {
  const response = await AuthAxios.patch(
    `/business/invoice/customers/${customer_id}/`,
    payload
  );
  return response?.data;
};

export const FetchTaxesApi = async () => {
  const response = await AuthAxios.get(`/business/invoice/tax/`);
  return response?.data;
};

export const CreateInvoiceTaxApi = async (payload: ICreateTaxPayload) => {
  const response = await AuthAxios.post(`/business/invoice/tax/`, payload);
  return response?.data;
};

export const FetchInvoicesApi = async (params: IFectchInvoiceParams) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  const response = await AuthAxios.get(
    `/business/invoice/?${queryParams.toString()}`
  );
  return response.data;
};

export const CreateInvoiceApi = async (
  payload: ICreateInvoicePayload,
  isDraft: boolean = false
) => {
  const response = await AuthAxios.post(
    `/business/invoice/?is_draft=${isDraft}`,
    payload
  );
  return response?.data;
};

export const FetchInvoiceDetailApi = async (invoice_id: string) => {
  const response = await AuthAxios.get(`/business/invoice/${invoice_id}/`);
  return response?.data as IInvoice;
};

export const FetchInvoiceIndexApi = async () => {
  const response = await AuthAxios.get(`/business/invoice/indexes/new/`);
  return response?.data;
};

export const FetchInvoiceStatusApi = async (invoice_id: string) => {
  const response = await AuthAxios.get(
    `/business/invoice/activity/logs/?invoice_id=${invoice_id}`
  );
  return response?.data as iInvoiceLogsResponse;
};

export const UpdateInvoiceApi = async (
  invoice_id: string,
  payload: ICreateInvoicePayload,
  isDraft: boolean = false
) => {
  const response = await AuthAxios.put(
    `/business/invoice/${invoice_id}/?is_draft=${isDraft}`,
    payload
  );
  return response?.data;
};

export const SendInvoiceMailApi = async (
  invoice_id: string,
  payload: SendInvoicemailPayload
) => {
  const response = await AuthAxios.post(
    `/business/invoice/send/mail/?invoice_id=${invoice_id}`,
    payload
  );
  return response?.data;
};

export const UpdateInvoiceStatusApi = async (
  invoice_id: string | null,
  status: IInvoiceStatus
) => {
  const response = await AuthAxios.patch(
    `/business/invoice/${invoice_id}/?status=${status}`
  );
  return response?.data;
};

export const DeleteCustomerApi = async (customer_id: string) => {
  const response = await AuthAxios.delete(
    `/business/invoice/customers/${customer_id}/`
  );
  return response?.data;
};
