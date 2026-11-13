"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

export default function FlowOverlay({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const autofocus = ref.current?.querySelector<HTMLInputElement>("input");
    if (autofocus) autofocus.focus({ preventScroll: true });
    else ref.current?.focus();
    return () => previous?.focus();
  }, [mounted]);
  if (!mounted) return null;
  return createPortal(
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[110] overflow-y-auto bg-[#f8f7fa] text-[#19151e] leading-[1.4]"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const elements = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]',
        );
        if (!elements?.length) {
          event.preventDefault();
          return;
        }
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <Image
        src="/icons/Logo-4.svg"
        width={104}
        height={46}
        alt="Raiz"
        className="hidden md:block absolute top-8 left-6"
      />
      <div className="max-w-[688px] px-5 md:px-6 mx-auto pt-8 md:pt-16 pb-10 [@media(max-height:800px)]:pt-6 max-md:pt-6 [@media(max-height:800px)]:pb-6 max-md:pb-6 [&_button.relative]:!rounded-xl [&_button.relative]:min-h-12">
        {children}
      </div>
    </div>,
    document.body,
  );
}
