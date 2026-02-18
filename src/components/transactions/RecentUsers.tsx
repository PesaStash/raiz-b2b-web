import React from "react";
import { truncateString } from "@/utils/helpers";
import { ISearchedUser } from "@/types/user";
import Avatar from "../ui/Avatar";
import { IExternalAccount } from "@/types/services";

interface P2PProps {
  type: "p2p";
  users: ISearchedUser[];
  setSelectedUser: (arg: ISearchedUser) => void;
}

interface ExternalProps {
  type: "external";
  users: IExternalAccount[];
  setSelectedUser: (arg: IExternalAccount) => void;
}

type Props = P2PProps | ExternalProps;

const RecentUsers = ({ users, setSelectedUser, type = "p2p" }: Props) => {
  // Render function for P2P users
  const renderP2PUser = (
    user: ISearchedUser,
    setUser: (arg: ISearchedUser) => void,
  ) => {
    const avatarSrc = user.selfie_image;
    const accountName = user.account_name;
    const username = user.username;

    return (
      <button
        key={user?.entity_id}
        className="flex flex-col justify-center items-center gap-0.5 px-2 flex-shrink-0"
        onClick={() => setUser(user)}
      >
        <Avatar src={avatarSrc} name={accountName || "Unknown"} />
        <p
          title={accountName || ""}
          className="text-center text-raiz-gray-950 text-[13px] font-semibold leading-none"
        >
          {truncateString(accountName || "", 25)}
        </p>
        {username && (
          <p
            title={username || ""}
            className="text-center text-raiz-gray-700 text-xs leading-[18px]"
          >
            @{truncateString(username, 14)}
          </p>
        )}
      </button>
    );
  };

  // Render function for External users
  const renderExternalUser = (
    user: IExternalAccount,
    setUser: (arg: IExternalAccount) => void,
  ) => {
    const avatarSrc = "";
    const accountName = user.bank_account_name;
    const username = user.bank_account_number;

    return (
      <button
        key={user?.bank_account_number}
        className="flex flex-col  justify-center items-center gap-0.5 px-2 flex-shrink-0"
        onClick={() => setUser(user)}
      >
        <Avatar src={avatarSrc} name={accountName || "Unknown"} />
        <p
          title={accountName || ""}
          className="text-center text-raiz-gray-950 text-[13px] font-semibold leading-none"
        >
          {truncateString(accountName || "", 25)}
        </p>
        {username && (
          <p
            title={username || ""}
            className="text-center text-raiz-gray-700 text-xs leading-[18px]"
          >
            {truncateString(username || "", 20)}
          </p>
        )}
      </button>
    );
  };
  return (
    <div className="w-full">
      <h5 className="text-raiz-gray-950 text-sm font-bold  leading-[16.80px] mb-[15px]">
        Recents
      </h5>
      <div className="flex gap-2 overflow-x-scroll no-scrollbar">
        {type === "p2p"
          ? users.map((user) =>
              renderP2PUser(
                user as ISearchedUser,
                setSelectedUser as (arg: ISearchedUser) => void,
              ),
            )
          : users.map((user) =>
              renderExternalUser(
                user as IExternalAccount,
                setSelectedUser as (arg: IExternalAccount) => void,
              ),
            )}
      </div>
    </div>
  );
};

export default RecentUsers;
