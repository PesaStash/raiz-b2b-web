"use client";
import { ISearchedUser } from "@/types/user";
import { debounce } from "lodash";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { FlowHeader, FlowCard } from "./send-flow/Flow";
import { useQuery } from "@tanstack/react-query";
import { SearchAllUsersApi } from "@/services/user";
import { IUserSearchParams } from "@/types/services";
import { useUser } from "@/lib/hooks/useUser";
import Avatar from "../ui/Avatar";
import { findWalletByCurrency } from "@/utils/helpers";
import { useCurrencyStore } from "@/store/useCurrencyStore";

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
        <Avatar
          className="!bg-[#f3f1fd] !text-primary2 shrink-0"
          src={user?.selfie_image}
          name={user?.account_name}
          size={44}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-raiz-gray-950 truncate">
            {user.account_name || "Unknown User"}
          </p>
          <p className="text-xs text-raiz-gray-500 truncate">
            @{user.username}
          </p>
        </div>
        <Image
          src="/images/send/chevron.svg"
          width={18}
          height={18}
          alt=""
          className="rotate-180"
        />
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

  const debouncedSetQueryTerm = useMemo(
    () =>
      debounce((value: string) => {
        setQueryTerm(value);
      }, 500),
    [],
  );

  const { data, isLoading, isError, refetch } = useQuery({
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

  const suggestions = data?.results || [];

  useEffect(() => {
    return () => debouncedSetQueryTerm.cancel();
  }, [debouncedSetQueryTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSetQueryTerm(value);
  };

  const searching = searchTerm !== queryTerm || isLoading;
  return (
    <>
      {header && goBack && (
        <FlowHeader
          title="Send to a Raizer"
          subtitle="Find someone by username or email"
          onBack={goBack}
        />
      )}
      <FlowCard className="!gap-10">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-3 text-[13px]">
            Search
            <input
              value={searchTerm}
              onChange={handleInputChange}
              placeholder="Username or email"
              className="h-12 w-full bg-[#f4f4f8] rounded-xl px-3.5 text-sm outline-primary2"
            />
          </label>
          {!searchTerm && recentUsers.length > 0 && (
            <>
              <h2 className="text-[13px] text-[#79708d] font-semibold">
                Recent
              </h2>
              <div className="flex gap-3 overflow-x-auto">
                {recentUsers.slice(0, 6).map((person) => (
                  <button
                    type="button"
                    key={person.entity_id ?? person.username}
                    className="flex flex-col items-center gap-1.5 w-[84px] shrink-0"
                    onClick={() => setSelectedUser(person)}
                  >
                    <Avatar
                      className="!bg-[#f3f1fd] !text-primary2 shrink-0"
                      name={person.account_name}
                      src={person.selfie_image}
                      size={52}
                    />
                    <span className="text-xs font-semibold truncate max-w-full">
                      {person.account_name?.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {searchTerm ? (
          searching ? (
            <p
              role="status"
              className="text-[#79708d] text-sm py-8 text-center"
            >
              Searching for a Raizer…
            </p>
          ) : isError ? (
            <div role="alert" className="text-center text-sm">
              <p>Couldn’t search recipients.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-primary2 mt-3 font-semibold"
              >
                Try again
              </button>
            </div>
          ) : suggestions.length ? (
            <ul className="flex flex-col gap-4">
              {suggestions.map((person) => (
                <RecipientRow
                  key={person.entity_id ?? person.username}
                  user={person}
                  setSelectedUser={setSelectedUser}
                />
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <h2 className="font-semibold">No match found</h2>
              <p className="text-sm text-[#79708d] mt-2">
                Check the username or email and try again.
              </p>
            </div>
          )
        ) : beneficiaries.length ? (
          <section>
            <h2 className="text-[13px] text-[#79708d] font-semibold mb-4">
              Your Raizers
            </h2>
            <ul className="flex flex-col gap-4">
              {beneficiaries.map((person) => (
                <RecipientRow
                  key={person.entity_id ?? person.username}
                  user={person}
                  setSelectedUser={setSelectedUser}
                />
              ))}
            </ul>
          </section>
        ) : (
          recentUsers.length === 0 && (
            <div className="py-8 text-center">
              <h2 className="font-semibold">{emptyStateTitle}</h2>
              <p className="mt-2 text-sm text-[#79708d]">
                Search by username or email to send your first transfer.
              </p>
            </div>
          )
        )}
      </FlowCard>
    </>
  );
};
export default FindRecipients;
