"use client";
import React, { useRef, useState } from "react";
import { LiaTimesSolid } from "react-icons/lia";
import Image from "next/image";
import { format } from "date-fns";
import DateRange from "../../transactions/_components/DateRange";
import SelectField from "@/components/ui/SelectField";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Avatar from "@/components/ui/Avatar";
import {
  blobToBase64,
  convertField,
  convertTime,
  copyToClipboard,
  downloadInvoice,
  formatAmount,
  generateInvoicePDFBlob,
  getCurrencySymbol,
  truncateString,
} from "@/utils/helpers";
import dayjs from "dayjs";
import Skeleton from "react-loading-skeleton";
import InvoiceTableMoreOpts from "./InvoiceTableMoreOpts";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import SideModalWrapper from "../../_components/SideModalWrapper";
import AddNewCustomer from "../../customers/_components/AddNewCustomer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IFectchInvoiceParams } from "@/types/services";
import {
  FetchInvoicesApi,
  SendInvoiceMailApi,
  UpdateInvoiceStatusApi,
} from "@/services/invoice";
import Pagination from "@/components/ui/Pagination";
import { IInvoice } from "@/types/invoice";
import InvoiceFile from "./InvoiceFile";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";
import SearchBox from "@/components/ui/SearchBox";
import { useDebounce } from "@/lib/hooks/useDebounce";
import EmptyInvoiceTable from "./EmptyInvoiceTable";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";

const columnHelper = createColumnHelper<IInvoice>();
type DateFilterType = "date_created" | "date_issued" | "due_date";

const InvoicesTable = () => {
  const [showDateRange, setShowDateRange] = useState(false)
  const [showDateOpts, setShowDateOpts] = useState(false);
  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [invoiceToDownload, setInvoiceToDownload] = useState<IInvoice | null>(
    null
  );
  const [dateFilterType, setDateFilterType] = useState<DateFilterType | null>(null);
  const [invoiceToEmail, setInvoiceToEmail] = useState<IInvoice | null>(null);
  const [sendingMail, setSendingmail] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: "", label: "All" },
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    // { value: "overdue", label: "Overdue" },
    // { value: "cancelled", label: "Cancelled" },
    { value: "draft", label: "Draft" },
    { value: "awaiting_payment", label: "Awaiting payment" },
  ];

  const handleDownloadInvoice = async (invoice: IInvoice) => {
    try {
      setInvoiceToDownload(invoice);

      setTimeout(async () => {
        if (!invoiceRef.current) return;

        await downloadInvoice(invoiceRef, invoice.invoice_number, "pdf");
        setInvoiceToDownload(null);
        toast.success("Pdf downloaded successfully ");
      }, 200);
    } catch (error) {
      console.error("Failed to download invoice:", error);
      setInvoiceToDownload(null);
      toast.error("Error downloading pdf");
    }
  };

  const qc = useQueryClient();

  const StatusMutation = useMutation({
    mutationFn: (invoice: IInvoice) =>
      UpdateInvoiceStatusApi(invoice?.invoice_id, invoice.status),
    onSuccess: () => {
      toast.success("Invoice status updated successfully!");
      qc.invalidateQueries({ queryKey: ["invoice-detail"] });
      qc.invalidateQueries({ queryKey: ["invoices-list"] });
      qc.invalidateQueries({ queryKey: ["invoice-activity"] });
    },
  });

  const handleSendEmail = async (invoice: IInvoice) => {
    if (sendingMail) return;

    setSendingmail(true);
    setInvoiceToEmail(invoice);
    const toastId = toast.loading("Generating invoice PDF...");

    // Wait for the invoice to render
    setTimeout(async () => {
      try {
        if (!invoiceRef.current) {
          throw new Error("Invoice reference not found");
        }

        const pdfBlob = await generateInvoicePDFBlob(invoiceRef);
        if (!pdfBlob) throw new Error("Failed to generate invoice PDF");

        toast.loading("Converting PDF to base64...", { id: toastId });
        const pdfBase64 = await blobToBase64(pdfBlob);

        const payload = {
          payment_link: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/pay/${user?.business_account?.username}`,
          invoice_pdf_url: pdfBase64,
        };

        toast.loading("Sending invoice email...", { id: toastId });
        await SendInvoiceMailApi(invoice.invoice_id, payload);
        toast.success("Invoice email sent successfully!", { id: toastId });

        qc.invalidateQueries({
          queryKey: ["invoices-list"],
        });
        qc.invalidateQueries({
          queryKey: ["invoice-detail", invoice.invoice_id],
        });
        qc.invalidateQueries({
          queryKey: ["invoice-activity", invoice.invoice_id],
        });
      } catch (err) {
        console.error("Email sending failed:", err);
        toast.error("Failed to send invoice email. Please try again.", {
          id: toastId,
        });
      } finally {
        setSendingmail(false);
        setInvoiceToEmail(null);
      }
    }, 200);
  };

  const handleMarkAsPaid = (invoice: IInvoice) => {
    StatusMutation.mutate({ ...invoice, status: "paid" });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<IInvoice, any>[] = [
    columnHelper.accessor("customer.business_name", {
      header: "Customer",
      cell: (info) => {
        const val = info?.row?.original.customer.business_name || info?.row?.original.customer.full_name

       return <div className="flex items-center gap-2 font-brSonoma">
          <Avatar name="" src={""} />
          <span className="text-sm font-medium text-raiz-gray-950">
            {truncateString(val, 28)}
          </span>
        </div>
      },
    }),
    columnHelper.accessor("invoice_number", {
      header: "Invoice #",
      cell: (info) => (
        <span className="text-sm font-medium text-raiz-gray-950">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("created_at", {
      header: "Date Created",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700">
          {dayjs(convertTime(info.getValue())).format("DD MMM YYYY")}
        </span>
      ),
    }),
    columnHelper.accessor("issue_date", {
      header: "Date Issued",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700">
          {dayjs(convertTime(info.getValue())).format("DD MMM YYYY")}
        </span>
      ),
    }),
    // columnHelper.accessor("customer.full_name", {
    //   header: "Contact Person",
    //   cell: (info) => (
    //     <span className="text-sm font-brSonoma text-raiz-gray-700">
    //       {info.getValue()}
    //     </span>
    //   ),
    // }),
    columnHelper.accessor("due_date", {
      header: "Due Date",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700">
          {dayjs(convertTime(info.getValue())).format("DD MMM YYYY")}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue()?.toLowerCase();
        const dotColor =
          status === "paid"
            ? "bg-green-500"
            : status === "pending"
            ? "bg-yellow-500"
            : status === "draft"
            ? "bg-[#CED3D2]"
            : status === "sent"
            ? "bg-[#0D90DC]"
            : "bg-red-500";

        return (
          <div className="w-fit flex items-center capitalize px-1.5 py-0.5 gap-1 text-xs font-brSonoma border border-raiz-gray-200 rounded-md">
            <span className={`w-2 h-2 rounded-full  ${dotColor}`}></span>
            {convertField(status)}
          </div>
        );
      },
    }),
    columnHelper.accessor("total_amount", {
      header: "Amount",
      cell: (info) => {
        return (
          <span
            className={`text-sm font-normal  font-brSonoma  text-raiz-gray-700`}
          >
            {`+ ${getCurrencySymbol(info.row.original?.currency)}${formatAmount(
              info?.getValue()
            )}`}
          </span>
        );
      },
    }),
    columnHelper.accessor("customer.email", {
      header: "Email Address",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("customer.phone_number", {
      header: "Phone Number",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "due_days",
      header: "Due Days",
      cell: (info) => {
        const dueDate = dayjs(convertTime(info.row.original.due_date));
        const now = dayjs();
        const diff = dueDate.diff(now, "day");

        let label = "";

        if (diff > 0) {
          label = `${diff} day${diff > 1 ? "s" : ""} left`;
        } else if (diff === 0) {
          label = "Due today";
        } else {
          label = `${Math.abs(diff)} day${
            Math.abs(diff) > 1 ? "s" : ""
          } overdue`;
        }

        return <span className={`text-sm font-brSonoma }`}>{label}</span>;
      },
    }),
    columnHelper.accessor("invoice_id", {
      header: "",
      cell: (info) => {
        const totalRows = info.table.getRowModel().rows.length;
        const currentIndex = info.row.index;
        const shouldShowUpward =
          totalRows <= 3
            ? currentIndex === totalRows - 1
            : currentIndex >= totalRows - 3;
        const invoice = info.row.original;
        return (
          <InvoiceTableMoreOpts
            invoice={info.row.original}
            isLast={shouldShowUpward}
            onEdit={() =>
              router.push(`/invoice/${info?.row?.original?.invoice_id}/edit`)
            }
            onCopyLink={() => {
              copyToClipboard(
                `${window.location.origin}/invoice/${invoice.invoice_id}`
              );
            }}
            onDownloadPDF={() => handleDownloadInvoice(invoice)}
            onSendEmail={() => handleSendEmail(invoice)}
            onView={() =>
              router.push(`/invoice/${info?.row?.original?.invoice_id}`)
            }
            onMarkAsPaid={() => handleMarkAsPaid(invoice)}
            from="table"
          />
        );
      },
    }),
  ];

  const debouncedSearch = useDebounce(searchTerm, 500)

  const pageSize = 10;

  const dateFromKey =
    dateFilterType === "date_created"
      ? "created_at_from"
      : dateFilterType === "date_issued"
        ? "issued_date_from"
        : dateFilterType === "due_date"
          ? "due_date_from"
          : undefined;

  const dateToKey =
    dateFilterType === "date_created"
      ? "created_at_to"
      : dateFilterType === "date_issued"
        ? "issued_date_to"
        : dateFilterType === "due_date"
          ? "due_date_to"
          : undefined;

  const params: IFectchInvoiceParams = {
    status: status ? status : undefined,
    search: debouncedSearch ? debouncedSearch : undefined,
    page: currentPage,
    limit: pageSize,
    ...(dateFromKey && dateRange.startDate
      ? { [dateFromKey]: dayjs(dateRange.startDate).format("YYYY-MM-DD") }
      : {}),
    ...(dateToKey && dateRange.endDate
      ? { [dateToKey]: dayjs(dateRange.endDate).format("YYYY-MM-DD") }
      : {}),
   
  };

  const { data, isLoading } = useQuery({
    queryKey: ["invoices-list", params],
    queryFn: ({ queryKey }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, params] = queryKey as [string, IFectchInvoiceParams];
      return FetchInvoicesApi(params);
    },
  });

  const InvoiceList = data?.invoices || [];
  const totalPages = data?.pagination?.total_pages
    ? data.pagination?.total_pages
    : Math.ceil(InvoiceList?.length / pageSize) || 1;

  const table = useReactTable({
    data: InvoiceList,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const dateFilterArr = [
    "date_created",
    "date_issued",
    "due_date",
  ].map((item) => ({
    label: convertField(item),
    value: item,
  }));
const closeCalendar = () => {
  setShowDateRange(false);
  // setDateFilterType(null)
  setShowDateOpts(false)
}
  // const customerBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useOutsideClick(() => closeCalendar());
  return (
    <section className="w-full h-full">
      {/* {InvoiceList?.length > 0 && ( */}
      <div className="flex gap-3 items-center mb-6">
        {/* Customer search */}
        {/* <div className="relative">
          <button
            ref={customerBtnRef}
            onClick={() => setShowSearchBox(!showSearchBox)}
            className="w-48 gap-2  px-3.5 py-2.5 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border  border-zinc-200 inline-flex justify-between items-center"
          >
            <span className="text-zinc-800 text-sm font-bold  leading-none">
              {selectedCustomer ? selectedCustomer?.full_name : "Customers"}
            </span>
            <Image
              src={"/icons/search.svg"}
              alt="search"
              width={20}
              height={20}
            />
          </button>
          {showSearchBox && (
            <CustomerSearchBox
              setShowSearchBox={setShowSearchBox}
              btnRef={customerBtnRef}
              addNew={() => setShowAddCustomer(true)}
              onSelectCustomer={(customer) => {
                setSelectedCustomer(customer);
              }}
              selectedCustomerId={selectedCustomer?.customer_id}
              onUnselectCustomer={() => setSelectedCustomer(null)}
            />
          )}
        </div> */}
        <SearchBox
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="!w-[285px] !h-10 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200 "
          inputClassName="rounded-lg bg-white"
          iconClassName="top-[9.5px]"
        />
        {/* Status */}
        <SelectField
          placeholder="Status"
          options={statusOptions}
          // value={status}
          value={
            status
              ? statusOptions.find((option) => option.value === status) || null
              : null
          }
          onChange={(i) => setStatus(i?.value as string)}
          bgColor="#fff"
         width="160px"
          style={{
            height: "40px"
          }}
          minHeight="40px"
          height="40px"
          placeholderStyle={{
            fontWeight: "bold",
            color: "#2C2435",
          }}
        />
        {/* dates */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDateOpts(!showDateOpts)}
            className="flex h-10 gap-1.5 items-center px-3.5 py-2.5 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200 "
          >
            <Image
              src={"/icons/calendar.svg"}
              alt="calendar"
              width={20}
              height={20}
            />
            <span className="text-zinc-800 text-sm font-bold leading-none">
              {dateRange.startDate && dateRange.endDate
                ? `${format(dateRange.startDate, "dd MMM")} - ${format(
                    dateRange.endDate,
                    "dd MMM"
                  )}`
                : "Select dates"}
            </span>
            {dateFilterType ? (<svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path opacity="0.4" d="M13.7333 3.73336V5.20002C13.7333 5.73336 13.4 6.40002 13.0667 6.73336L10.2 9.26669C9.8 9.60002 9.53334 10.2667 9.53334 10.8V13.6667C9.53334 14.0667 9.26667 14.6 8.93334 14.8L8 15.4C7.13334 15.9334 5.93334 15.3334 5.93334 14.2667V10.7334C5.93334 10.2667 5.66667 9.66669 5.4 9.33336L4.73334 8.63336L8.61334 2.40002H12.4C13.1333 2.40002 13.7333 3.00002 13.7333 3.73336Z" fill="#6F5B86" />
              <path d="M7.53333 2.40002L4.08 7.94002L2.86666 6.66669C2.53333 6.33336 2.26666 5.73336 2.26666 5.33336V3.80002C2.26666 3.00002 2.86666 2.40002 3.6 2.40002H7.53333Z" fill="#6F5B86" />
              <circle cx="12.5" cy="2.5" r="2.5" fill="#DC180D" />
            </svg>
) : <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path opacity="0.4" d="M13.7333 3.73336V5.20002C13.7333 5.73336 13.4 6.40002 13.0667 6.73336L10.2 9.26669C9.8 9.60002 9.53334 10.2667 9.53334 10.8V13.6667C9.53334 14.0667 9.26667 14.6 8.93334 14.8L8 15.4C7.13334 15.9334 5.93334 15.3334 5.93334 14.2667V10.7334C5.93334 10.2667 5.66667 9.66669 5.4 9.33336L4.73334 8.63336L8.61334 2.40002H12.4C13.1333 2.40002 13.7333 3.00002 13.7333 3.73336Z" fill="#6F5B86" />
              <path d="M7.53333 2.40002L4.08 7.94002L2.86666 6.66669C2.53333 6.33336 2.26666 5.73336 2.26666 5.33336V3.80002C2.26666 3.00002 2.86666 2.40002 3.6 2.40002H7.53333Z" fill="#6F5B86" />          
            </svg>}

          </button>
          {showDateOpts && <div className="bg-[#FCFCFD] py-2 w-[220px] border border-[#F3F1F6] rounded-md shadow-md absolute top-12 right-0 z-50">
            {dateFilterArr?.map((item) => (
              <div
                key={item.value}
                onClick={() => {
                  setDateFilterType(item.value as DateFilterType);
                  setShowDateOpts(false);
                  setShowDateRange(true);
                }}
                className={`px-4 py-2 text-sm text-raiz-gray-700 flex justify-between items-center cursor-pointer hover:bg-[#EAECFF99] ${dateFilterType === item.value && "bg-[#EAECFF99]"}`}
              >
                <span>{item.label}</span> 
               {dateFilterType === item.value && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#443852" />
                </svg>}
              </div>
            ))}
          </div>}
          {dateFilterType && showDateRange && (
            <DateRange
              onApply={setDateRange}
              onClose={() => setShowDateRange(false)}
            />
          )}
        </div>
        {dateRange.startDate && (
          <button
            onClick={() => {setDateRange({}); setDateFilterType(null)}}
            className="flex items-center justify-center w-10 h-10 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200"
          >
            <LiaTimesSolid />
          </button>
        )}

        {/* export */}
        {/* <button className="flex h-11 gap-1.5 items-center px-3.5 py-2.5 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200 ">
          <Image
            src={"/icons/export.svg"}
            alt="Export"
            width={20}
            height={20}
          />
          <span className="text-zinc-800 text-sm font-bold leading-none">
            Export
          </span>
        </button> */}
      </div>
      {/* )} */}
      {isLoading ? (
        <div className="w-full overflow-x-auto ">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b ">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="whitespace-nowrap ">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="py-3 px-4 text-raiz-gray-700 bg-[#EAECFF99] text-[13px] font-normal font-monzo"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              <tr>
                <td colSpan={columns.length}>
                  <Skeleton count={4} className="mb-3" height={48} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : InvoiceList.length > 0 ? (
        <>
          <div className="w-full overflow-x-auto h-full ">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b ">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="whitespace-nowrap">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="py-3 px-4 text-raiz-gray-700 bg-[#EAECFF99] text-[13px] font-normal font-monzo"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 whitespace-nowrap"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 ">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              className="fixed inset-0 -z-50 overflow-hidden pointer-events-none"
              aria-hidden="true"
            >
              {(invoiceToDownload || invoiceToEmail) && (
                <div className="absolute top-[100vh] left-0 w-full">
                  <InvoiceFile
                    ref={invoiceRef}
                    data={invoiceToEmail || invoiceToDownload!}
                  />
                </div>
              )}
            </div>
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      ) : (
        <EmptyInvoiceTable />
      )}
      <AnimatePresence>
        {showAddCustomer ? (
          <SideModalWrapper close={() => setShowAddCustomer(false)}>
            <AddNewCustomer close={() => setShowAddCustomer(false)} />
          </SideModalWrapper>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default InvoicesTable;
