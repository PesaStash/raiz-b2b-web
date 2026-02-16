"use client";
import React, { useState } from "react";
// import Image from "next/image";
// import { format } from "date-fns";
// import DateRange from "../transactions/_components/DateRange";
// import { LiaTimesSolid } from "react-icons/lia";
import SearchBox from "@/components/ui/SearchBox";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { truncateString } from "@/utils/helpers";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "react-loading-skeleton";
import CustomerTableMoreOpt from "./CustomerTableMoreOpt";
import { useQuery } from "@tanstack/react-query";
import { FetchCustomers } from "@/services/invoice";
import { useDebounce } from "@/lib/hooks/useDebounce";
import Pagination from "@/components/ui/Pagination";
import { ICustomer } from "@/types/invoice";
import EmptyList from "@/components/ui/EmptyList";
import { AnimatePresence } from "motion/react";
import SideModalWrapper from "../../_components/SideModalWrapper";
import EditCustomer from "./EditCustomer";
import DeleteCustomer from "./DeleteCustomer";
import Overlay from "@/components/ui/Overlay";

const columnHelper = createColumnHelper<ICustomer>();

const CustomersTable = () => {
  // const [showDateRange, setShowDateRange] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // const [dateRange, setDateRange] = useState<{
  //   startDate?: Date;
  //   endDate?: Date;
  // }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null
  );
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const handleEditCustomer = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setShowEdit(true);
  };

  const handleDeleteCustomer = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setShowDelete(true);
  };

  const handleCloseEdit = () => {
    setShowEdit(false);
    setSelectedCustomer(null);
  };

  const handleCloseDelete = () => {
    setShowDelete(false);
    setSelectedCustomer(null);
  };

  const pageSize = 10;

  const debouncedSearch = useDebounce(searchTerm, 500);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<ICustomer, any>[] = [
    columnHelper.display({
      id: "S/N",
      header: "",
      cell: (info) => {
        const rowIndex = (currentPage - 1) * pageSize + info.row.index + 1;
        return (
          <span className="text-sm font-brSonoma text-raiz-gray-700">
            {rowIndex}
          </span>
        );
      },
    }),
    columnHelper.accessor("business_name", {
      header: "Customer",
      cell: (info) => {
        const customer = info.row.original;
        const displayName = customer.business_name || customer.full_name;

        return (
          <div className="flex items-center gap-2 font-brSonoma">
            <Avatar name="" src={""} />
            <span className="text-sm font-medium text-raiz-gray-950">
              {truncateString(displayName, 28)}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("customer_type", {
      header: "Customer Type",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700 capitalize">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("email", {
      header: "Email Address",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("phone_number", {
      header: "Phone Number",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("city", {
      header: "City",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("customer_id", {
      header: "",
      cell: (info) => {
        const isLast =
          info.row.index >= info.table.getRowModel().rows.length - 3;
        return (
          <CustomerTableMoreOpt
            customer={info.row.original}
            isLast={isLast}
            onViewDetails={() => {}}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
          />
        );
      },
    }),
  ];

  const { data, isLoading } = useQuery({
    queryKey: [
      "customers",
      {
        ...(debouncedSearch && { search: debouncedSearch }),
        page: currentPage,
      },
    ],
    queryFn: ({ queryKey }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, params] = queryKey as [
        string,
        {
          search?: string;
          page?: number;
          limit?: number;
        }
      ];
      return FetchCustomers(params);
    },
  });

  const customers = data?.customers || [];
  const totalPages = data?.pagination_details?.total_pages
    ? data.pagination_details.total_pages
    : Math.ceil(customers?.length / pageSize) || 1;
  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="w-full h-full">
      <div className="flex gap-3 items-center mb-6">
        {/* dates */}
        {/* <div className="relative ">
          <button
            onClick={() => setShowDateRange(!showDateRange)}
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
          </button>
          {showDateRange && (
            <DateRange
              onApply={setDateRange}
              onClose={() => setShowDateRange(false)}
            />
          )}
        </div>
        {dateRange.startDate && (
          <button
            onClick={() => setDateRange({})}
            className="flex items-center justify-center w-10 h-10 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200"
          >
            <LiaTimesSolid />
          </button>
        )} */}
        <SearchBox
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="!w-[285px] !h-10 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200 "
          inputClassName="rounded-lg bg-white"
          iconClassName="top-[9.5px]"
        />
        {/* export */}
        {/* <button className="flex h-10 gap-1.5 items-center px-3.5 py-2.5 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200 ">
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
                <td colSpan={5}>
                  <Skeleton count={4} className="mb-3" height={48} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : customers?.length > 0 ? (
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
        <div className="flex   justify-center items-center">
          <EmptyList text="No customers added yet" />
        </div>
      )}
      <AnimatePresence>
        {showEdit && selectedCustomer ? (
          <SideModalWrapper close={handleCloseEdit}>
            <EditCustomer close={handleCloseEdit} customer={selectedCustomer} />
          </SideModalWrapper>
        ) : null}
      </AnimatePresence>
      {showDelete && selectedCustomer ? (
        <Overlay close={handleCloseDelete}>
          <DeleteCustomer
            close={handleCloseDelete}
            customer={selectedCustomer}
          />
        </Overlay>
      ) : null}
    </section>
  );
};

export default CustomersTable;
