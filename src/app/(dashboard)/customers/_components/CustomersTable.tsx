"use client";
import React, { useState } from "react";
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
import EditCustomer from "./EditCustomer";
import DeleteCustomer from "./DeleteCustomer";
import Overlay from "@/components/ui/Overlay";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import MobileCustomerCards, {
  MobileCustomerCardsSkeleton,
} from "@/components/mobile/MobileCustomerCards";

const columnHelper = createColumnHelper<ICustomer>();

const CustomersTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
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
            <Avatar name={displayName} src="" />
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
      const [, params] = queryKey as [
        string,
        {
          search?: string;
          page?: number;
          limit?: number;
        },
      ];
      return FetchCustomers(params);
    },
  });

  const customers = data?.customers || [];
  const totalPages = data?.pagination?.total_pages
    ? data.pagination.total_pages
    : Math.ceil(customers?.length / pageSize) || 1;

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const hasCustomers = customers.length > 0;

  return (
    <section className="w-full min-w-0">
      <div className="mb-4 lg:mb-6 p-3 sm:p-0 bg-white lg:bg-transparent rounded-2xl lg:rounded-none border border-raiz-gray-100 lg:border-0 shadow-sm lg:shadow-none">
        <SearchBox
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search customers..."
          className="!w-full !max-w-none !h-11 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200"
          inputClassName="rounded-lg bg-white"
          iconClassName="top-[11px]"
        />
      </div>

      {isLoading ? (
        <>
          <div className="hidden lg:block w-full overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="whitespace-nowrap">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="py-3 px-4 text-raiz-gray-700 bg-[#EAECFF99] text-[13px] font-normal font-monzo"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7}>
                    <Skeleton count={4} className="mb-3" height={48} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <MobileCustomerCardsSkeleton />
        </>
      ) : hasCustomers ? (
        <>
          <div className="hidden lg:block w-full overflow-x-auto rounded-xl border border-raiz-gray-100 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="whitespace-nowrap">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="py-3 px-4 text-raiz-gray-700 bg-[#EAECFF99] text-[13px] font-normal font-monzo"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
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
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <MobileCustomerCards
            customers={customers}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
          />

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex justify-center items-center py-12 lg:py-16 bg-white lg:bg-transparent rounded-2xl lg:rounded-none border border-raiz-gray-100 lg:border-0">
          <EmptyList
            text={
              debouncedSearch
                ? "No customers match your search"
                : "No customers added yet"
            }
          />
        </div>
      )}

      <AnimatePresence>
        {showEdit && selectedCustomer ? (
          <CenterModalWrapper close={handleCloseEdit}>
            <EditCustomer close={handleCloseEdit} customer={selectedCustomer} />
          </CenterModalWrapper>
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
