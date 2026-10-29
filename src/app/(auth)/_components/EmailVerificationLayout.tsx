import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import "@/styles/auth.css";

const EmailVerificationLayout = ({ children }: { children: ReactNode }) => (
  <section className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#f7f9fb] font-monzo text-[#14141e]">
    <Image className="pointer-events-none absolute -left-[340px] -top-[480px] -z-10 max-w-none" src="/images/auth/otp-glow-blue.svg" width={1080} height={1080} alt="" priority />
    <Image className="pointer-events-none absolute -bottom-[336px] -right-[360px] -z-10 max-w-none" src="/images/auth/otp-glow-purple.svg" width={960} height={960} alt="" priority />
    <header className="flex shrink-0 items-center justify-between gap-4 px-6 py-6 md:px-12 md:py-10">
      <Link href="/login" aria-label="Raiz home" className="md:px-2">
        <Image src="/icons/Logo.svg" width={92} height={32} alt="Raiz" priority />
      </Link>
      <a href="mailto:support@raiz.app" className="flex items-center gap-1.5 text-sm font-semibold hover:underline">
        <Image src="/images/auth/help.svg" width={18} height={18} alt="" />
        Need help?
      </a>
    </header>
    <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6">{children}</div>
    <footer className="px-6 py-6 text-center text-xs leading-[17px] text-[#989caa] md:py-10">
      Raiz Finance is a financial technology company, not a bank. Accounts are provided by licensed partners.
    </footer>
  </section>
);

export default EmailVerificationLayout;
