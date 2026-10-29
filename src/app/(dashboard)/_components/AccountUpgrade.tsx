"use client";
import Link from "next/link";
import { withBusinessWrite } from "@/components/team/BusinessWrite";
function AccountUpgrade() { return <div className="my-6 rounded-2xl border border-kyb-border bg-white p-6 font-monzo"><h2 className="text-xl font-bold">Finish setting up your business</h2><p className="mt-2 text-sm text-kyb-muted">Verify your basic business details, then choose USD, NGN or both.</p><Link href="/onboarding" className="mt-5 inline-block rounded-xl bg-raiz-usd-primary px-6 py-3 text-sm font-semibold text-white">Continue setup</Link></div>; }
export default withBusinessWrite(AccountUpgrade);
