"use client";
import React, { useRef, useState } from "react";
import InvoiceFile from "../_components/InvoiceFile";
import InvoiceTableMoreOpts from "../_components/InvoiceTableMoreOpts";
import InvoiceMobileBack from "../_components/InvoiceMobileBack";
import Button from "@/components/ui/Button";
import { useParams, useRouter } from "next/navigation";
import InvoiceActivity from "../_components/InvoiceActivity";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FetchInvoiceDetailApi,
  FetchInvoiceStatusApi,
  SendInvoiceMailApi,
  UpdateInvoiceStatusApi,
} from "@/services/invoice";
import Loading from "@/app/loading";

import { toast } from "sonner";
import {
  blobToBase64,
  convertField,
  downloadInvoice,
  formatAmount,
  generateInvoicePDFBlob,
  getCurrencySymbol,
} from "@/utils/helpers";
import { useUser } from "@/lib/hooks/useUser";
import { IInvoiceStatus } from "@/types/invoice";

const statusStyles: Record<string, { dot: string; badge: string }> = {
  paid: { dot: "bg-green-500", badge: "border-emerald-200 text-emerald-700 bg-emerald-50" },
  pending: { dot: "bg-yellow-500", badge: "border-amber-200 text-amber-700 bg-amber-50" },
  draft: { dot: "bg-[#CED3D2]", badge: "border-raiz-gray-200 text-raiz-gray-600 bg-raiz-gray-50" },
  sent: { dot: "bg-[#0D90DC]", badge: "border-sky-200 text-sky-700 bg-sky-50" },
  awaiting_payment: { dot: "bg-[#0D90DC]", badge: "border-sky-200 text-sky-700 bg-sky-50" },
};

const InvoiceDetail = () => {
  const { invoiceNo } = useParams<{ invoiceNo: string }>();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useUser();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoice-detail", invoiceNo],
    queryFn: () => FetchInvoiceDetailApi(invoiceNo),
  });
  const { data: logs } = useQuery({
    queryKey: ["invoice-activity", invoiceNo],
    queryFn: () => FetchInvoiceStatusApi(invoiceNo),
  });

  const StatusMutation = useMutation({
    mutationFn: (status: IInvoiceStatus) =>
      UpdateInvoiceStatusApi(data?.invoice_id || null, status),
    onSuccess: () => {
      toast.success("Invoice status updated successfully!");
      qc.invalidateQueries({ queryKey: ["invoice-detail", invoiceNo] });
      qc.invalidateQueries({ queryKey: ["invoices-list"] });
      qc.invalidateQueries({ queryKey: ["invoice-activity", invoiceNo] });
    },
  });

  const [sendingMail, setSendingmail] = useState(false);

  if (isLoading) {
    return <Loading />;
  }

  if (!data || isError) {
    return (
      <section className="p-4 sm:p-6 min-w-0">
        <InvoiceMobileBack href="/invoice" label="Invoices" />
        <div className="flex justify-center items-center h-48 rounded-xl border border-raiz-gray-100 bg-white">
          <p className="text-red-600 text-sm">Error fetching invoice details.</p>
        </div>
      </section>
    );
  }

  const handleDownload = async () => {
    try {
      await downloadInvoice(invoiceRef, data.invoice_number, "pdf");
      toast.success("Pdf downloaded successfully ");
    } catch (error) {
      toast.error("Error downloading pdf");
      console.log(error);
    }
  };

  const handleSendEmail = async () => {
    setSendingmail(true);
    const toastId = toast.loading("Generating invoice PDF...");

    try {
      const pdfBlob = await generateInvoicePDFBlob(invoiceRef);
      if (!pdfBlob) throw new Error("Failed to generate invoice PDF");

      toast.loading("Converting PDF to base64...", { id: toastId });
      const pdfBase64 = await blobToBase64(pdfBlob);

      const payload = {
        payment_link: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/pay/${user?.business_account?.username}`,
        invoice_pdf_url: pdfBase64,
      };

      toast.loading("Sending invoice email...", { id: toastId });
      await SendInvoiceMailApi(data.invoice_id, payload);
      toast.success("Invoice email sent successfully!", { id: toastId });
      qc.invalidateQueries({
        queryKey: ["invoices-list", "invoice-detail", invoiceNo],
      });
    } catch (err) {
      console.error("Email sending failed:", err);
      toast.error("Failed to send invoice email. Please try again.", {
        id: toastId,
      });
    } finally {
      setSendingmail(false);
    }
  };

  const handleStatusChange = (status: IInvoiceStatus) => {
    StatusMutation.mutate(status);
  };

  const statusKey = data.status?.toLowerCase() ?? "";
  const statusStyle = statusStyles[statusKey] ?? {
    dot: "bg-red-500",
    badge: "border-red-200 text-red-700 bg-red-50",
  };

  return (
    <section className="min-w-0 pb-4 md:pb-0">
      <InvoiceMobileBack href="/invoice" label="Invoices" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 md:mb-6">
        <div className="min-w-0">
          <h1 className="text-zinc-900 text-xl sm:text-2xl font-bold leading-7 truncate">
            {data.invoice_number}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1.5 capitalize text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyle.badge}`}
            >
              <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
              {convertField(statusKey)}
            </span>
            <span className="text-sm font-semibold text-zinc-700">
              {getCurrencySymbol(data.currency)}
              {formatAmount(data.total_amount)}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="hidden sm:inline-flex shrink-0"
          onClick={() => router.push(`/invoice/${invoiceNo}/edit`)}
        >
          Edit Invoice
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-12 w-full min-w-0">
        <div className="w-full lg:w-[80%] min-w-0">
          <InvoiceFile ref={invoiceRef} data={data} />
        </div>
        <aside className="w-full lg:w-[20%] shrink-0">
          <div className="rounded-xl border border-raiz-gray-100 bg-white p-4 shadow-sm lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <InvoiceActivity activities={logs?.invoice_activity_logs || []} />
          </div>
        </aside>
      </div>

      <div className="mt-4 lg:mt-8 rounded-xl border border-raiz-gray-100 bg-white p-4 lg:p-0 lg:border-0 lg:bg-transparent shadow-sm lg:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <InvoiceTableMoreOpts
            invoice={data}
            isLast={true}
            onEdit={() => router.push(`/invoice/${invoiceNo}/edit`)}
            onCopyLink={() => {}}
            onDownloadPDF={handleDownload}
            from="preview"
          />
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              className="sm:hidden w-full"
              onClick={() => router.push(`/invoice/${invoiceNo}/edit`)}
            >
              Edit Invoice
            </Button>
            {data?.status === "pending" ? (
              <Button
                className="w-full sm:w-[200px]"
                disabled={sendingMail}
                onClick={handleSendEmail}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.3334 13.6666H4.66671C2.66671 13.6666 1.33337 12.6666 1.33337 10.3333V5.66659C1.33337 3.33325 2.66671 2.33325 4.66671 2.33325H11.3334C13.3334 2.33325 14.6667 3.33325 14.6667 5.66659V10.3333C14.6667 12.6666 13.3334 13.6666 11.3334 13.6666Z"
                      stroke="#FCFCFD"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M11.3333 6L9.24662 7.66667C8.55996 8.21333 7.43329 8.21333 6.74662 7.66667L4.66663 6"
                      stroke="#FCFCFD"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                iconClassName="left-[19%]"
              >
                Send Email
              </Button>
            ) : data?.status === "awaiting_payment" ? (
              <Button
                onClick={() => handleStatusChange("paid")}
                disabled={StatusMutation.isPending}
                loading={StatusMutation.isPending}
                iconClassName="left-[17%]"
                icon={
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 1.3335C4.32667 1.3335 1.33333 4.32683 1.33333 8.00016C1.33333 11.6735 4.32667 14.6668 8 14.6668C11.6733 14.6668 14.6667 11.6735 14.6667 8.00016C14.6667 4.32683 11.6733 1.3335 8 1.3335ZM11.1867 6.46683L7.40667 10.2468C7.31333 10.3402 7.18667 10.3935 7.05333 10.3935C6.92 10.3935 6.79333 10.3402 6.7 10.2468L4.81333 8.36016C4.62 8.16683 4.62 7.84683 4.81333 7.6535C5.00667 7.46016 5.32667 7.46016 5.52 7.6535L7.05333 9.18683L10.48 5.76016C10.6733 5.56683 10.9933 5.56683 11.1867 5.76016C11.38 5.9535 11.38 6.26683 11.1867 6.46683Z"
                      fill="#FCFCFD"
                    />
                  </svg>
                }
                className="w-full sm:w-[212px]"
              >
                Mark as Paid
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvoiceDetail;
