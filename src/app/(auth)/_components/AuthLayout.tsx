import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import "@/styles/auth.css";

const AuthLayout = ({ children, login = false }: { children: ReactNode; login?: boolean }) => (
  <section className="auth-page min-h-screen bg-white p-6 font-monzo text-[#14141e] lg:grid lg:grid-cols-[1.035714fr_1fr] lg:gap-6">
    <div className="flex min-w-0 flex-col lg:min-h-0">
      <header className="flex flex-wrap items-center justify-between gap-4 lg:px-8">
        <Link href="/login" aria-label="Raiz home">
          <Image
            src="/icons/Logo.svg"
            width={92}
            height={32}
            alt="Raiz"
            priority
          />
        </Link>
        <p className="text-sm text-[#6b6b80]">{login ? "Don’t have an account?" : "Have an account?"}{"  "}<Link className="font-semibold text-raiz-usd-primary hover:underline" href={login ? "/register" : "/login"}>{login ? "Sign up" : "Log in"}</Link>
        </p>
      </header>
      <div className="flex flex-1 items-center justify-center px-0 py-8 lg:px-8 lg:py-4">{children}</div>
    </div>
    <aside className="auth-graphics relative hidden overflow-hidden rounded-[28px] lg:block" aria-label="Business banking with Raiz">
      <Image
        src="/images/auth/business-team.png"
        alt="Business owners reviewing their finances together"
        fill
        sizes="50vw"
        className="auth-panel-photo object-cover"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,31,51,0.05)_0%,rgba(5,31,51,0.15)_45%,rgba(5,26,43,0.92)_100%)]" />
      <div className="auth-payment-card absolute left-6 top-14 flex items-center gap-3 rounded-[18px] bg-white/95 px-4 py-3.5 shadow-[0_18px_40px_rgba(13,26,51,0.25)] xl:left-10">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f6ee]">
          <Image
            src="/images/auth/payment-received.svg"
            width={20}
            height={20}
            alt=""
          />
        </div>
        <div>
          <p className="text-sm font-semibold">Payment received</p>
          <p className="mt-0.5 text-xs text-[#6b6b80]">Hamburg Exports GmbH · EUR → USD</p>
        </div>
        <p className="ml-3 text-base font-bold text-[#1f9d55]">+$6,156.62</p>
      </div>
      <div className="auth-account-card absolute right-10 top-[196px] w-[300px] rounded-[18px] bg-white/95 px-5 py-[18px] shadow-[0_18px_40px_rgba(13,26,51,0.25)]">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#e7f1f7] font-bold text-raiz-usd-primary">$</span>
          <p className="flex-1 text-sm font-semibold">USD account</p>
          <span className="rounded-full bg-[#e8f6ee] px-2 py-[3px] text-[11px] font-semibold text-[#1f9d55]">Active</span>
        </div>
        <dl className="flex flex-col gap-3 text-[13px]">{[["Account name", "Kijani Foods Ltd"], ["Account number", "8000 1234 4521"], ["ACH routing", "021 000 089"]].map(([label, value]) => <div key={label} className="flex justify-between gap-2">
          <dt className="text-[#6b6b80]">{label}</dt>
          <dd className="font-semibold">{value}</dd>
        </div>)}</dl>
      </div>
      <div className="auth-panel-copy absolute inset-x-10 bottom-10 flex flex-col gap-4 text-white">
        <h2 className="text-[32px] font-bold leading-[1.15] xl:text-[40px]">Get paid from anywhere.<br />Keep it in dollars.</h2>
        <p className="max-w-[520px] text-base leading-6 text-white/80">US, EU and UK account details, a naira account and stablecoin deposits — all in your business name.</p>
        <div className="auth-currency-chips flex flex-wrap gap-2">{["$ USD", "€ EUR", "£ GBP", "₦ NGN", "◎ USDT · USDC"].map(currency => <span key={currency} className="rounded-full border border-white/20 bg-white/15 px-3 py-[7px] text-[13px] font-semibold backdrop-blur-sm">{currency}</span>)}</div>
      </div>
    </aside>
  </section>
);

export default AuthLayout;
