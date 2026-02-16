"use client";
import React, { useRef, useState } from "react";
import InvoiceFile from "../_components/InvoiceFile";
import InvoiceTableMoreOpts from "../_components/InvoiceTableMoreOpts";
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
  downloadInvoice,
  generateInvoicePDFBlob,
  // uploadPDF,
} from "@/utils/helpers";
import { useUser } from "@/lib/hooks/useUser";
import { IInvoiceStatus } from "@/types/invoice";

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
      <div className="flex justify-center items-center">
        <p>Error feching Invoice details</p>
      </div>
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

  return (
    <section className="mt-10 h-full flex flex-col items-center">
      <h1 className="text-zinc-900 text-2xl font-bold  leading-7 text-left mb-12 w-full">
        {data?.invoice_number}
      </h1>
      <section className="flex justify-between gap-12 w-full ">
        <div className="w-[80%]">
          <InvoiceFile ref={invoiceRef} data={data} />
        </div>
        <aside className="w-[20%]">
          <InvoiceActivity activities={logs?.invoice_activity_logs || []} />
        </aside>
      </section>
      <div className="w-full px-8 py-6 mt-8 border-t border-gray-100 flex justify-between items-center">
        <InvoiceTableMoreOpts
          invoice={data}
          isLast={true}
          onEdit={() => router.push(`/invoice/${invoiceNo}/edit`)}
          onCopyLink={() => {}}
          onDownloadPDF={handleDownload}
          from="preview"
        />
        {data?.status === "pending" ? (
          <Button
            className="w-[200px]"
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
            className="w-[212px]"
          >
            Mark as Paid
          </Button>
        ) : null}
      </div>
    </section>
  );
};

export default InvoiceDetail;
