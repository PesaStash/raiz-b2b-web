import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "@/utils/ReactQueryProvider";
import localFont from "next/font/local";
import { Suspense } from "react";
import Loading from "./loading";
import MainLayout from "@/components/layouts/MainLayout";
import { Toaster } from "sonner";
import "react-loading-skeleton/dist/skeleton.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const monzoSans = localFont({
  src: [
    {
      path: "../../public/fonts/MonzoSansText-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/MonzoSansText-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/MonzoSansText-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/MonzoSansText-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/MonzoSansText-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/MonzoSansText-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--monzo",
});

const brSonoma = localFont({
  src: [
    {
      path: "../../public/fonts/BRSonoma-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/BRSonoma-ExtraLight.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/BRSonoma-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/BRSonoma-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/BRSonoma-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/BRSonoma-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/BRSonoma-Thin.otf",
      weight: "100",
      style: "normal",
    },
  ],
  variable: "--font-br-sonoma",
});

export const metadata: Metadata = {
  title: "Raiz Business",
  description:
    "Seamless banking, global transactions, and spending—all in one place.",
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest"></link>
      </head>
      <body
        className={`${inter.variable}  ${monzoSans.variable} ${brSonoma.variable} `}
      >
        <Provider>
          <MainLayout>
            <Suspense fallback={<Loading />}>{children}</Suspense>
            <Toaster
              toastOptions={{
                unstyled: true,
                classNames: {
                  default:
                    "rounded-[20px]  px-5 py-4 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]  min-w-[303px] justify-start items-center gap-3 inline-flex text-[#fcfcfd] text-sm font-bold  leading-[16.80px]",
                  error: "bg-[#db180d]",
                  success: "bg-[#5ca512] ",
                  warning: "bg-yellow-400",
                  info: "bg-[#488ee8]",
                  loading: "bg-[#475467]",
                },
              }}
              icons={{
                success: (
                  <svg width="21" height="22" viewBox="0 0 21 22" fill="none">
                    <g clipPath="url(#clip0_23792_6377)">
                      <path
                        d="M21 11C21 16.7986 16.2986 21.5 10.5 21.5C4.70137 21.5 0 16.7986 0 11C0 5.20137 4.70137 0.5 10.5 0.5C16.2986 0.5 21 5.20137 21 11Z"
                        fill="#C8E6C9"
                      />
                      <path
                        d="M15.1318 6.88086L9.19496 12.8247L6.74409 10.3809L5.50684 11.6181L9.19671 15.2992L16.3695 8.11811L15.1318 6.88086Z"
                        fill="#4CAF50"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_23792_6377">
                        <rect
                          width="21"
                          height="21"
                          fill="white"
                          transform="translate(0 0.5)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
                ),
                info: (
                  <svg width="21" height="22" viewBox="0 0 21 22" fill="none">
                    <path
                      d="M10.5 19.75C15.3325 19.75 19.25 15.8325 19.25 11C19.25 6.16751 15.3325 2.25 10.5 2.25C5.66751 2.25 1.75 6.16751 1.75 11C1.75 15.8325 5.66751 19.75 10.5 19.75Z"
                      fill="#C5DDF5"
                    />
                    <path
                      d="M9.625 15.375V11C9.625 10.517 10.017 10.125 10.5 10.125C10.983 10.125 11.375 10.517 11.375 11V15.375C11.375 15.858 10.983 16.25 10.5 16.25C10.017 16.25 9.625 15.858 9.625 15.375Z"
                      fill="#488FE9"
                    />
                    <path
                      d="M10.5 8.375C11.2249 8.375 11.8125 7.78737 11.8125 7.0625C11.8125 6.33763 11.2249 5.75 10.5 5.75C9.77513 5.75 9.1875 6.33763 9.1875 7.0625C9.1875 7.78737 9.77513 8.375 10.5 8.375Z"
                      fill="#488FE9"
                    />
                  </svg>
                ),
                error: (
                  <svg width="21" height="22" viewBox="0 0 21 22" fill="none">
                    <path
                      d="M21 11C21 16.7981 16.2981 21.5 10.5 21.5C4.7019 21.5 0 16.7981 0 11C0 5.2019 4.7019 0.5 10.5 0.5C16.2981 0.5 21 5.2019 21 11Z"
                      fill="url(#paint0_linear_23792_6392)"
                    />
                    <path
                      d="M15.2325 6.26838C15.6424 6.6783 15.6424 7.34316 15.2325 7.75308L7.2521 15.7335C6.84218 16.1434 6.17732 16.1434 5.7674 15.7335C5.35748 15.3236 5.35748 14.6587 5.7674 14.2488L13.7478 6.26838C14.1577 5.85846 14.8226 5.85846 15.2325 6.26838Z"
                      fill="white"
                    />
                    <path
                      d="M15.2325 15.7335C14.8226 16.1434 14.1577 16.1434 13.7478 15.7335L5.7674 7.75308C5.35748 7.34316 5.35748 6.6783 5.7674 6.26838C6.17732 5.85846 6.84218 5.85846 7.2521 6.26838L15.2325 14.2488C15.6424 14.6587 15.6424 15.3236 15.2325 15.7335Z"
                      fill="white"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_23792_6392"
                        x1="10.5"
                        y1="21.5"
                        x2="10.5"
                        y2="0.5"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#FF634D" />
                        <stop offset="0.204" stopColor="#FE6464" />
                        <stop offset="0.521" stopColor="#FC6581" />
                        <stop offset="0.794" stopColor="#FA6694" />
                        <stop offset="0.989" stopColor="#FA669A" />
                        <stop offset="1" stopColor="#FA669A" />
                      </linearGradient>
                    </defs>
                  </svg>
                ),
              }}
            />
          </MainLayout>
        </Provider>
      </body>
    </html>
  );
}
//
