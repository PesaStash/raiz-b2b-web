"use client";
import { withBusinessWrite } from "@/components/team/BusinessWrite";
import GlobalTopUp from "../GlobalTopUp";

function NgnTopUp({ close }: { close: () => void }) {
  return <GlobalTopUp currency="NGN" close={close} />;
}
export default withBusinessWrite(NgnTopUp);
