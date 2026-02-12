"use client";
import Button from "@/components/ui/Button";
import React from "react";
import Image from "next/image";
import Link from "next/link";

const EmptyInvoiceTable = () => {
  return (
    <div className="flex  flex-col justify-between h-[80%]  ">
      <div className="flex h-1/2  flex-col justify-center items-center bg-[url('/images/empty-spiral.png')] bg-no-repeat bg-bottom">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            width="48"
            height="48"
            rx="24"
            fill="#EAECFF"
            fillOpacity="0.6"
          />
          <path
            d="M15.1666 36H28.5C30.7093 36 32.5 34.2093 32.5 32V16C32.5 13.7907 30.7093 12 28.5 12H16.5L11.1666 17.3333V32C11.1666 34.2093 12.9573 36 15.1666 36Z"
            fill="#FFDAF9"
          />
          <path
            d="M16.5 16V12L11.1666 17.3333H15.1666C15.9026 17.3333 16.5 16.736 16.5 16Z"
            fill="#7174DD"
          />
          <path
            d="M38.776 17.724C38.2546 17.2027 37.412 17.2027 36.8906 17.724L35.8506 18.764C35.0706 18.5747 34.2186 18.7587 33.5453 19.2413C31.98 18.0787 29.76 18.1893 28.34 19.6093L26.2253 21.724C25.704 22.2453 25.704 23.088 26.2253 23.6093C26.484 23.8693 26.8253 24 27.1666 24C27.508 24 27.8493 23.8693 28.1093 23.6093L30.224 21.496C30.5746 21.1453 31.0666 21.052 31.5133 21.1733L25.6613 26.8707C24.8986 27.6133 24.324 28.5293 23.988 29.5387L23.1666 32C23.1666 32.736 23.764 33.3333 24.5 33.3333L26.9626 32.512C27.9733 32.1747 28.888 31.6013 29.6306 30.8387L37.052 23.2187C37.7493 22.5227 37.9733 21.5373 37.7373 20.648L38.776 19.6093C39.2973 19.088 39.2973 18.2453 38.776 17.724Z"
            fill="#7174DD"
          />
          <path
            d="M20.5 28H16.5C15.764 28 15.1666 27.4027 15.1666 26.6667C15.1666 25.9307 15.764 25.3334 16.5 25.3334H20.5C21.236 25.3334 21.8333 25.9307 21.8333 26.6667C21.8333 27.4027 21.236 28 20.5 28Z"
            fill="#7174DD"
          />
          <path
            d="M21.8333 22.6667H16.5C15.764 22.6667 15.1666 22.0693 15.1666 21.3333C15.1666 20.5973 15.764 20 16.5 20H21.8333C22.5693 20 23.1666 20.5973 23.1666 21.3333C23.1666 22.0693 22.5693 22.6667 21.8333 22.6667Z"
            fill="#7174DD"
          />
          <path
            d="M17.8333 33.3333H16.5C15.764 33.3333 15.1666 32.736 15.1666 32C15.1666 31.264 15.764 30.6666 16.5 30.6666H17.8333C18.5693 30.6666 19.1666 31.264 19.1666 32C19.1666 32.736 18.5693 33.3333 17.8333 33.3333Z"
            fill="#7174DD"
          />
        </svg>
        <h4 className=" text-zinc-900 text-sm font-semibold mt-[14px] mb-3">
          Let&apos;s get you started
        </h4>
        <p className="text-center justify-start text-zinc-900 text-xs font-normal  leading-none">
          You haven&apos;t created any invoices yet. Start by sending your first
          one to a client.
        </p>
        <Link href={"/invoice/create-new"}>
          <Button
            className="w-[214px] mt-6"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M9.99996 1.66663C5.40829 1.66663 1.66663 5.40829 1.66663 9.99996C1.66663 14.5916 5.40829 18.3333 9.99996 18.3333C14.5916 18.3333 18.3333 14.5916 18.3333 9.99996C18.3333 5.40829 14.5916 1.66663 9.99996 1.66663ZM13.3333 10.625H10.625V13.3333C10.625 13.675 10.3416 13.9583 9.99996 13.9583C9.65829 13.9583 9.37496 13.675 9.37496 13.3333V10.625H6.66663C6.32496 10.625 6.04163 10.3416 6.04163 9.99996C6.04163 9.65829 6.32496 9.37496 6.66663 9.37496H9.37496V6.66663C9.37496 6.32496 9.65829 6.04163 9.99996 6.04163C10.3416 6.04163 10.625 6.32496 10.625 6.66663V9.37496H13.3333C13.675 9.37496 13.9583 9.65829 13.9583 9.99996C13.9583 10.3416 13.675 10.625 13.3333 10.625Z"
                  fill="#FDFDFD"
                />
              </svg>
            }
            iconPosition="left"
          >
            <span className="ml-2">Create First Invoice</span>
          </Button>
        </Link>
      </div>
      <div className="h-1/2 px-16 bg-gray-100 flex flex-col py-[56px] w-[81vw] relative left-[-24%]  translate-x-[20%]">
        <h4 className="text-center justify-start text-zinc-900 mb-16 text-base font-bold leading-tight">
          Life Cycle of Invoice
        </h4>
        <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-20">
          {[
            {
              icon: "/icons/draft-icon.svg",
              title: "Create & Save Drafts",
              text: "Start your invoice, save progress anytime, and return when you're ready to send.",
            },
            {
              icon: "/icons/send-icon.svg",
              title: "Send to Clients",
              text: "Share invoices instantly by email or download as PDF — your client gets notified right away.",
            },
            {
              icon: "/icons/track-icon.svg",
              title: "Track Payments",
              text: "See when invoices are viewed, mark them as paid, or send reminders if overdue.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center text-center max-w-64"
            >
              <Image src={item.icon} alt={item.title} width={32} height={32} />
              <h5 className="mt-4 font-semibold text-sm text-zinc-900">
                {item.title}
              </h5>
              <p className="mt-2 text-xs text-zinc-700 leading-snug">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmptyInvoiceTable;
