"use client";
import { ISearchedUser } from "@/types/user";
import { debounce } from "lodash";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import RecentUsers from "./RecentUsers";
import Beneficiaries from "./Beneficiaries";
import { useQuery } from "@tanstack/react-query";
import { SearchAllUsersApi } from "@/services/user";
import { IUserSearchParams } from "@/types/services";
import { useUser } from "@/lib/hooks/useUser";
import Avatar from "../ui/Avatar";
import { findWalletByCurrency } from "@/utils/helpers";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import MobileSheetHeader from "../mobile/MobileSheetHeader";

interface Props {
  recentUsers: ISearchedUser[];
  beneficiaries: ISearchedUser[];
  setSelectedUser: (user: ISearchedUser) => void;
  header?: boolean;
  goBack?: () => void;
  emptyStateTitle?: string;
}

const RecipientRow = ({
  setSelectedUser,
  user,
}: {
  user: ISearchedUser;
  setSelectedUser: (arg: ISearchedUser) => void;
}) => {
  return (
    <li>
      <button
        type="button"
        className="w-full p-3 flex gap-3 items-center rounded-xl bg-white active:bg-raiz-gray-100 transition-colors text-left"
        onClick={() => setSelectedUser(user)}
      >
        <Avatar src={user?.selfie_image} name={user?.account_name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-raiz-gray-950 truncate">
            {user.account_name || "Unknown User"}
          </p>
          <p className="text-xs text-raiz-gray-500 truncate">@{user.username}</p>
        </div>
      </button>
    </li>
  );
};

const FindRecipients = ({
  recentUsers,
  setSelectedUser,
  beneficiaries,
  header = false,
  goBack,
  emptyStateTitle = "You haven't Sent Money to any Raizers",
}: Props) => {
  const { user } = useUser();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const SBCAcct = findWalletByCurrency(user, "SBC");
  const GBPAcct = findWalletByCurrency(user, "GBP");
  const EURAcct = findWalletByCurrency(user, "EUR");

  const { selectedCurrency } = useCurrencyStore();

  const getCurrentWallet = () => {
    if (selectedCurrency.name === "NGN") {
      return NGNAcct;
    } else if (selectedCurrency.name === "USD") {
      return USDAcct;
    } else if (selectedCurrency.name === "SBC") {
      return SBCAcct;
    } else if (selectedCurrency.name === "GBP") {
      return GBPAcct;
    } else if (selectedCurrency.name === "EUR") {
      return EURAcct;
    }
  };

  const currentWallet = getCurrentWallet();
  const [searchTerm, setSearchTerm] = useState("");
  const [queryTerm, setQueryTerm] = useState("");

  const [suggestions, setSuggestions] = useState<ISearchedUser[]>([]);
  const debouncedSetQueryTerm = useMemo(
    () =>
      debounce((value: string) => {
        setQueryTerm(value);
      }, 500),
    [],
  );

  const { data, isLoading } = useQuery({
    queryKey: [
      "searched-users",
      { wallet_id: currentWallet?.wallet_id, search: queryTerm },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, IUserSearchParams];
      return SearchAllUsersApi(params);
    },
    enabled: !!queryTerm && !!currentWallet?.wallet_id,
  });

  useEffect(() => {
    setSuggestions(data?.results || []);
  }, [data]);

  useEffect(() => {
    return () => debouncedSetQueryTerm.cancel();
  }, [debouncedSetQueryTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSetQueryTerm(value);
  };

  const recentsLayout = isMobile ? "list" : "grid";
  const hasHistory = recentUsers.length > 0 || beneficiaries.length > 0;

  return (
    <div className="flex flex-col min-h-0 pb-2">
      {header && goBack && (
        <MobileSheetHeader title="Find Recipient" onBack={goBack} />
      )}

      <div className="relative w-full shrink-0">
        <Image
          className="absolute top-1/2 left-3.5 -translate-y-1/2 pointer-events-none"
          src={"/icons/search.svg"}
          alt=""
          width={20}
          height={20}
        />
        <input
          value={searchTerm}
          onChange={handleInputChange}
          placeholder="Search username or email"
          className="pl-11 pr-4 h-12 w-full bg-raiz-gray-50 text-sm rounded-2xl border border-raiz-gray-200 focus:outline-none focus:border-primary2/40 focus:ring-2 focus:ring-primary2/10"
        />
      </div>

      {isLoading && searchTerm && (
        <ul className="mt-3 w-full flex flex-col gap-2">
          {Array(3)
            .fill("")
            .map((_, index) => (
              <li key={index} className="flex gap-3 items-center p-2">
                <div className="bg-raiz-gray-200 animate-pulse size-11 rounded-full shrink-0" />
                <div className="p-2 bg-raiz-gray-200 animate-pulse rounded-xl h-11 flex-1" />
              </li>
            ))}
        </ul>
      )}

      {!isLoading && searchTerm && (
        <div className="mt-3">
          {suggestions.length > 0 ? (
            <ul className="w-full flex flex-col gap-1 rounded-2xl bg-raiz-gray-50 p-2">
              {suggestions.map((user) => (
                <RecipientRow
                  key={user.entity_id ?? user.username}
                  user={user}
                  setSelectedUser={setSelectedUser}
                />
              ))}
            </ul>
          ) : (
            <p className="text-center text-sm text-raiz-gray-600 rounded-2xl bg-raiz-gray-50 py-12 px-4">
              No users found for &ldquo;{searchTerm}&rdquo;
            </p>
          )}
        </div>
      )}

      {!searchTerm && !hasHistory && (
        <div className="flex flex-col justify-center items-center text-center mt-8 text-raiz-gray-950 rounded-2xl bg-raiz-gray-50 py-14 px-6">
          <Image src={"/icons/send-3.svg"} alt="" width={48} height={48} />
          <h4 className="text-base font-bold leading-tight mt-5 mb-2">
            {emptyStateTitle}
          </h4>
          <p className="text-sm text-raiz-gray-600 leading-relaxed">
            Search by username or email to send money to another Raizer.
          </p>
        </div>
      )}

      {!searchTerm && hasHistory && (
        <div className="mt-5 rounded-2xl bg-raiz-gray-50 p-3 md:p-6">
          {!searchTerm && recentUsers.length > 0 && (
            <RecentUsers
              users={recentUsers}
              setSelectedUser={setSelectedUser}
              type="p2p"
              layout={recentsLayout}
            />
          )}
          {!searchTerm && beneficiaries.length > 0 && (
            <div className={recentUsers.length > 0 ? "mt-5" : ""}>
              <Beneficiaries users={beneficiaries} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindRecipients;
