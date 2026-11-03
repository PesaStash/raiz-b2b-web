"use client";
import { withBusinessWrite } from "@/components/team/BusinessWrite";
import GlobalTopUp from "../GlobalTopUp";

export type UsdTopupType = "amount" | "type" | "detail" | "confirm" | "status" | "payment" | "success";
function UsdTopUp({ close }: { close: () => void }) {
  return <GlobalTopUp currency="USD" close={close} />;
}
export default withBusinessWrite(UsdTopUp);
