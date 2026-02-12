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
    <li
      className="p-2 hover:bg-gray-100 cursor-pointer rounded-2xl flex gap-2 items-center"
      onClick={() => setSelectedUser(user)}
    >
      <Avatar src={user?.selfie_image} name={user?.account_name} />
      <div>
        <p className="text-sm font-semibold">
          {user.account_name || "Unknown User"}
        </p>
        <p className="text-xs text-gray-500">@{user.username}</p>
      </div>
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

  const { selectedCurrency } = useCurrencyStore();

  const getCurrentWallet = () => {
    if (selectedCurrency.name === "NGN") {
      return NGNAcct;
    } else if (selectedCurrency.name === "USD") {
      return USDAcct;
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
    []
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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => debouncedSetQueryTerm.cancel();
  }, [debouncedSetQueryTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSetQueryTerm(value);
  };

  //   console.log("userssss", suggestions);

  return (
    <div className="">
      {header && (
        <div>
          <button onClick={goBack}>
            <Image
              src={"/icons/arrow-left.svg"}
              alt="back"
              width={18.48}
              height={18.48}
            />
          </button>
          <header className="flex justify-between items-center mt-5 mb-9">
            <h2 className=" text-zinc-900 text-base font-bold  leading-tight">
              Find Recipient
            </h2>
            <button>
              <Image
                src={"/icons/qr.svg"}
                width={18}
                height={19.2}
                alt="scan"
              />
            </button>
          </header>
        </div>
      )}
      {/* search & suggestions */}
      <div className="">
        <div className="relative h-12 w-full">
          <Image
            className="absolute top-3.5 left-3"
            src={"/icons/search.svg"}
            alt="search"
            width={22}
            height={22}
          />
          <input
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Enter a username or email address"
            className="pl-10 h-full w-full bg-raiz-gray-50 text-sm rounded-[20px] border-raiz-gray-200 focus:outline-none outline-none border focus:border-2"
          />
        </div>
        {/*loading */}
        {isLoading && searchTerm && (
          <ul className="mt-2 w-full">
            {Array(3)
              .fill("")
              .map((_, index) => (
                <li key={index} className="flex gap-3 mt-1">
                  <div className="bg-gray-200 animate-pulse w-12 h-12 rounded-full" />
                  <div className="p-2 bg-gray-200 animate-pulse rounded-md my-1 h-12 w-full" />
                </li>
              ))}
          </ul>
        )}
        {/* Suggestions */}
        {!isLoading &&
          searchTerm &&
          (suggestions.length > 0 ? (
            <ul className="mt-5 w-full overflow-y-scroll h-[80vh]">
              {suggestions.map((user, index) => (
                <RecipientRow
                  key={index}
                  user={user}
                  setSelectedUser={setSelectedUser}
                />
              ))}
            </ul>
          ) : (
            <div className="my-3">
              <p className="text-center text-sm">No users found</p>
            </div>
          ))}
      </div>

      {/* No history */}
      {!searchTerm &&
        recentUsers.length === 0 &&
        beneficiaries.length === 0 && (
          <div className="flex flex-col justify-center items-center text-center mt-28 text-zinc-900">
            <Image
              src={"/icons/send-3.svg"}
              alt="send"
              width={48}
              height={48}
            />
            <h4 className=" text-base font-bold leading-tight mt-6 mb-[14px]">
              {emptyStateTitle}
            </h4>
            <p className="  text-sm font-normal leading-tight">
              Tap the <span className="font-bold leading-none">search</span>{" "}
              icon or Tap the{" "}
              <span className="font-bold leading-none">QR Code</span> icon to
              send today!
            </p>
          </div>
        )}

      {/* Recent Users and Beneficiaries */}
      {!searchTerm && recentUsers.length > 0 && (
        <RecentUsers
          users={recentUsers}
          setSelectedUser={setSelectedUser}
          type="p2p"
        />
      )}
      {!searchTerm && beneficiaries.length > 0 && (
        <Beneficiaries users={beneficiaries} />
      )}
    </div>
  );
};

export default FindRecipients;
