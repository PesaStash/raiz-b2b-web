import React from "react";
import { ISearchedUser } from "@/types/user";
import { truncateString } from "@/utils/helpers";
import Avatar from "../ui/Avatar";
import { useSendStore } from "@/store/Send";

interface Props {
  users: ISearchedUser[];
  // selectUser: (user: ISearchedUser) => void;
}

const Beneficiaries = ({ users }: Props) => {
  const { actions } = useSendStore();
  return (
    <div className="w-full  mt-11">
      <h5 className="text-raiz-gray-950 text-[13px] font-bold  leading-[18.20px] mb-[15px]">
        Beneficiary
      </h5>
      <div className="flex flex-col gap-4">
        {users.map((user, index) => {
          const isLastItem = index === users.length - 1;
          return (
            <button
              onClick={() => actions.selectUser(user)}
              key={index}
              className={`flex w-full justify-between items-center ${
                !isLastItem ? "border-b border-gray-100" : ""
              }  border-gray-100 pb-[15px]`}
            >
              <div className="flex gap-3 items-center">
                <Avatar src={user?.selfie_image} name={user?.account_name} />
                <div className="flex flex-col gap-1 text-left">
                  <p className=" text-raiz-gray-950 text-[13px] font-semibold  leading-none">
                    {truncateString(user?.account_name || "", 25)}
                  </p>
                  <p className=" text-raiz-gray-700 text-xs leading-[18px]">
                    @{user?.username}
                  </p>
                </div>
              </div>
              {/* <button> */}
              <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                <path
                  d="M12.0049 2.69997C11.8647 2.69909 11.7271 2.73751 11.6077 2.81087C11.4882 2.88423 11.3917 2.98959 11.3291 3.115L8.75296 8.26735L2.63578 9.20876C2.49885 9.22991 2.37046 9.28858 2.26485 9.37826C2.15923 9.46793 2.08052 9.5851 2.03743 9.71678C1.99435 9.84846 1.98858 9.98951 2.02076 10.1243C2.05294 10.259 2.12182 10.3822 2.21976 10.4802L6.45121 14.7117L5.50882 20.8357C5.48774 20.9727 5.50504 21.1129 5.5588 21.2407C5.61256 21.3684 5.70068 21.4788 5.81337 21.5596C5.92607 21.6403 6.05893 21.6882 6.19721 21.698C6.33548 21.7078 6.47377 21.6791 6.59671 21.615L12 18.7957L17.4034 21.615C17.5263 21.6791 17.6646 21.7078 17.8029 21.698C17.9411 21.6882 18.074 21.6403 18.1867 21.5596C18.2994 21.4788 18.3875 21.3684 18.4413 21.2407C18.495 21.1129 18.5123 20.9727 18.4912 20.8357L17.5489 14.7117L21.7803 10.4802C21.8782 10.3822 21.9471 10.259 21.9793 10.1243C22.0115 9.98951 22.0057 9.84846 21.9626 9.71678C21.9195 9.5851 21.8408 9.46793 21.7352 9.37826C21.6296 9.28858 21.5012 9.22991 21.3643 9.20876L15.2471 8.26735L12.6709 3.115C12.6091 2.99107 12.5141 2.8867 12.3965 2.81344C12.279 2.74018 12.1434 2.7009 12.0049 2.69997Z"
                  fill="#FFC107"
                />
              </svg>
              {/* </button> */}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Beneficiaries;
