"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileSettingsMenu from "@/components/mobile/MobileSettingsMenu";

const SettingsPage = () => {
  const router = useRouter();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (mq.matches) router.replace("/settings/profile");
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [router]);

  return (
    <section className="w-full min-w-0 lg:hidden">
      <MobileSettingsMenu />
    </section>
  );
};

export default SettingsPage;
