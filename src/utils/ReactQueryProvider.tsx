"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 600000,
            throwOnError: false,
          },
          mutations: {
            throwOnError: false,
            // Axios interceptors already toast API errors. Keep failed
            // mutations from bubbling into Next.js as unhandled crashes.
            onError: () => undefined,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
