"use client";

import React, { useMemo, useState } from "react";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import Skeleton from "react-loading-skeleton";
import { AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import Overlay from "@/components/ui/Overlay";
import { FetchNotificationEmailsApi } from "@/services/business";
import { INotificationEmail } from "@/types/services";
import { useUser } from "@/lib/hooks/useUser";
import { convertTime, truncateString } from "@/utils/helpers";
import RecipientTableMoreOpt from "./RecipientTableMoreOpt";
import AddRecipientModal from "./AddRecipientModal";
import UpdateRecipientModal from "./UpdateRecipientModal";
import RemoveRecipientModal from "./RemoveRecipientModal";

type PrimaryRecipientRow = {
  kind: "primary";
  id: "primary";
  label: string;
  email: string;
  created_at: null;
  active: 1;
};

type ExtraRecipientRow = INotificationEmail & { kind: "extra" };

type RecipientRow = PrimaryRecipientRow | ExtraRecipientRow;

const columnHelper = createColumnHelper<RecipientRow>();

const StatusBadge = ({ active }: { active: boolean }) => (
  <div className="w-fit flex items-center px-2.5 py-1 gap-1.5 text-[13px] border border-raiz-gray-200 rounded-md font-medium text-raiz-gray-700 bg-white">
    <span
      className={`w-1.5 h-1.5 rounded-full ${
        active ? "bg-green-500" : "bg-orange-500"
      }`}
    />
    {active ? "Active" : "Muted"}
  </div>
);

const NotificationRecipientsTable = () => {
  const { user } = useUser();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRecipient, setSelectedRecipient] =
    useState<INotificationEmail | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showRemove, setShowRemove] = useState(false);

  const businessEmail = user?.business_account?.business_email?.trim() || "";
  const primaryLabel =
    user?.business_account?.business_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    "Primary";

  const { data, isLoading } = useQuery({
    queryKey: ["notification-emails"],
    queryFn: FetchNotificationEmailsApi,
  });

  const rows = useMemo<RecipientRow[]>(() => {
    const primaryRow: PrimaryRecipientRow | null = businessEmail
      ? {
          kind: "primary",
          id: "primary",
          label: primaryLabel,
          email: businessEmail,
          created_at: null,
          active: 1,
        }
      : null;

    const extras = (data?.data || [])
      .filter(
        (item) =>
          !businessEmail ||
          item.email.trim().toLowerCase() !== businessEmail.toLowerCase(),
      )
      .map(
        (item): ExtraRecipientRow => ({
          ...item,
          kind: "extra",
        }),
      );

    return primaryRow ? [primaryRow, ...extras] : extras;
  }, [businessEmail, data?.data, primaryLabel]);

  const handleEdit = (recipient: INotificationEmail) => {
    setSelectedRecipient(recipient);
    setShowEdit(true);
  };

  const handleRemove = (recipient: INotificationEmail) => {
    setSelectedRecipient(recipient);
    setShowRemove(true);
  };

  const handleCloseEdit = () => {
    setShowEdit(false);
    setSelectedRecipient(null);
  };

  const handleCloseRemove = () => {
    setShowRemove(false);
    setSelectedRecipient(null);
  };

  const columns = useMemo<ColumnDef<RecipientRow, unknown>[]>(
    () => [
      columnHelper.display({
        id: "recipient",
        header: "Recipient",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-2.5 font-brSonoma min-w-[160px]">
              <Avatar name={row.label} src="" />
              <span className="text-sm font-medium text-raiz-gray-950">
                {truncateString(row.label, 28)}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "email",
        header: "Email Address",
        cell: (info) => (
          <span className="text-sm font-brSonoma text-raiz-gray-700">
            {truncateString(info.row.original.email, 32)}
          </span>
        ),
      }),
      columnHelper.display({
        id: "date",
        header: "Date",
        cell: (info) => {
          const row = info.row.original;
          const date =
            row.kind === "primary"
              ? null
              : row.updated_at || row.created_at;
          return (
            <span className="text-sm font-brSonoma text-raiz-gray-700 whitespace-nowrap">
              {date
                ? dayjs(convertTime(date)).format("DD MMM YYYY @ h:mm A")
                : "—"}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        cell: (info) => (
          <StatusBadge active={info.row.original.active === 1} />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => {
          const row = info.row.original;
          if (row.kind === "primary") return null;

          const isLast =
            info.row.index >= info.table.getRowModel().rows.length - 3;

          return (
            <RecipientTableMoreOpt
              recipient={row}
              isLast={isLast}
              onEdit={handleEdit}
              onDelete={handleRemove}
            />
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="w-full min-w-0">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="">
          <h1 className="text-lg font-bold text-raiz-gray-950">
            Notification Recipients
          </h1>
          <p className="text-sm text-raiz-gray-600 mt-0.5">
            Manage email addresses that receive transactions notifications
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="w-full sm:w-auto min-w-0 sm:min-w-[188px] h-11 ml-auto"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M9.99996 1.66663C5.40829 1.66663 1.66663 5.40829 1.66663 9.99996C1.66663 14.5916 5.40829 18.3333 9.99996 18.3333C14.5916 18.3333 18.3333 14.5916 18.3333 9.99996C18.3333 5.40829 14.5916 1.66663 9.99996 1.66663ZM13.3333 10.625H10.625V13.3333C10.625 13.675 10.3416 13.9583 9.99996 13.9583C9.65829 13.9583 9.37496 13.675 9.37496 13.3333V10.625H6.66663C6.32496 10.625 6.04163 10.3416 6.04163 9.99996C6.04163 9.65829 6.32496 9.37496 6.66663 9.37496H9.37496V6.66663C9.37496 6.32496 9.65829 6.04163 9.99996 6.04163C10.3416 6.04163 10.625 6.32496 10.625 6.66663V9.37496H13.3333C13.675 9.37496 13.9583 9.65829 13.9583 9.99996C13.9583 10.3416 13.675 10.625 13.3333 10.625Z"
                fill="#FDFDFD"
              />
            </svg>
          }
          iconPosition="left"
        >
          <span className="ml-2 sm:ml-4">Add Recipient</span>
        </Button>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-raiz-gray-100 bg-white shadow-sm">
        {isLoading ? (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-raiz-gray-100 bg-[#FAFAFA]">
              <tr>
                {["Recipient", "Email Address", "Date", "Status", ""].map(
                  (header) => (
                    <th
                      key={header}
                      className="py-4 px-4 lg:px-6 text-raiz-gray-500 text-[13px] font-medium"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-6 py-4">
                  <Skeleton count={4} className="mb-3" height={48} />
                </td>
              </tr>
            </tbody>
          </table>
        ) : rows.length > 0 ? (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-raiz-gray-100 bg-[#FAFAFA]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="whitespace-nowrap">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="py-4 px-4 lg:px-6 text-raiz-gray-500 text-[13px] font-medium"
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
            <tbody className="divide-y divide-raiz-gray-100">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-raiz-gray-50/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 lg:px-6 py-4 align-middle">
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
        ) : (
          <div className="py-16 px-6 text-center text-sm text-raiz-gray-500">
            No notification recipients configured yet.
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd ? (
          <Overlay close={() => setShowAdd(false)} width="400px">
            <AddRecipientModal close={() => setShowAdd(false)} />
          </Overlay>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showEdit && selectedRecipient ? (
          <Overlay close={handleCloseEdit} width="400px">
            <UpdateRecipientModal
              close={handleCloseEdit}
              recipient={selectedRecipient}
            />
          </Overlay>
        ) : null}
      </AnimatePresence>

      {showRemove && selectedRecipient ? (
        <Overlay close={handleCloseRemove} width="400px">
          <RemoveRecipientModal
            close={handleCloseRemove}
            recipient={selectedRecipient}
          />
        </Overlay>
      ) : null}
    </section>
  );
};

export default NotificationRecipientsTable;
