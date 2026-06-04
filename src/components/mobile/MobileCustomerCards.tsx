"use client";

import Avatar from "@/components/ui/Avatar";
import { ICustomer } from "@/types/invoice";
import { convertField, truncateString } from "@/utils/helpers";
import Skeleton from "react-loading-skeleton";
import CustomerTableMoreOpt from "@/app/(dashboard)/customers/_components/CustomerTableMoreOpt";

type Props = {
  customers: ICustomer[];
  onEdit: (customer: ICustomer) => void;
  onDelete: (customer: ICustomer) => void;
  isLoading?: boolean;
};

export function MobileCustomerCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="lg:hidden flex flex-col bg-white rounded-2xl border border-raiz-gray-100 overflow-hidden shadow-sm">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 px-4 py-4 ${
            index > 0 ? "border-t border-raiz-gray-100" : ""
          }`}
        >
          <Skeleton circle width={44} height={44} />
          <div className="flex-1 min-w-0">
            <Skeleton width="60%" height={14} className="mb-2" />
            <Skeleton width="80%" height={12} className="mb-1.5" />
            <Skeleton width="50%" height={12} />
          </div>
          <Skeleton width={24} height={24} />
        </div>
      ))}
    </div>
  );
}

const typeBadgeClass: Record<string, string> = {
  individual: "bg-violet-50 text-violet-700 border-violet-200",
  business: "bg-sky-50 text-sky-700 border-sky-200",
};

const MobileCustomerCards = ({
  customers,
  onEdit,
  onDelete,
  isLoading,
}: Props) => {
  if (isLoading) {
    return <MobileCustomerCardsSkeleton />;
  }

  if (customers.length === 0) return null;

  return (
    <div className="lg:hidden flex flex-col bg-white rounded-2xl border border-raiz-gray-100 overflow-hidden shadow-sm">
      {customers.map((customer, index) => {
        const displayName =
          customer.business_name || customer.full_name || "—";
        const type = customer.customer_type?.toLowerCase() ?? "";
        const badgeClass =
          typeBadgeClass[type] ??
          "bg-raiz-gray-50 text-raiz-gray-600 border-raiz-gray-200";
        const isLast = index >= customers.length - 2;

        return (
          <article
            key={customer.customer_id}
            className={`flex items-start gap-3 px-4 py-4 ${
              index > 0 ? "border-t border-raiz-gray-100" : ""
            }`}
          >
            <Avatar name={displayName} src="" size={44} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-raiz-gray-950 truncate">
                    {truncateString(displayName, 32)}
                  </p>
                  <span
                    className={`inline-flex mt-1 capitalize text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeClass}`}
                  >
                    {convertField(type) || "Customer"}
                  </span>
                </div>
                <CustomerTableMoreOpt
                  customer={customer}
                  isLast={isLast}
                  onViewDetails={() => {}}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="block text-xs text-primary2 mt-2 truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {customer.email}
                </a>
              )}
              <p className="text-xs text-raiz-gray-500 mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5">
                {customer.phone_number && (
                  <span>{customer.phone_number}</span>
                )}
                {customer.phone_number && customer.city && (
                  <span className="text-raiz-gray-300">·</span>
                )}
                {customer.city && <span>{customer.city}</span>}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default MobileCustomerCards;
