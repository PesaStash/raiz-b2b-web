const PAGE_TITLES: { match: string | RegExp; title: string }[] = [
  { match: /^\/$/, title: "Dashboard" },
  { match: "/transactions", title: "Transactions" },
  { match: "/customers", title: "Customers" },
  { match: "/analytics", title: "Analytics" },
  { match: "/invoice/create-new", title: "New Invoice" },
  { match: /^\/invoice\/[^/]+\/edit/, title: "Edit Invoice" },
  { match: /^\/invoice\/[^/]+$/, title: "Invoice" },
  { match: "/invoice", title: "Invoices" },
  { match: "/bill-requests", title: "Bill Requests" },
  { match: "/developers", title: "Developers" },
  { match: "/settings/login-security", title: "Security" },
  { match: "/settings/help&support", title: "Help & Support" },
  { match: "/settings/profile", title: "Profile" },
  { match: "/settings", title: "Settings" },
];

export function getMobilePageTitle(pathname: string): string {
  for (const { match, title } of PAGE_TITLES) {
    if (typeof match === "string") {
      if (pathname === match || pathname.startsWith(match + "/")) {
        return title;
      }
    } else if (match.test(pathname)) {
      return title;
    }
  }
  return "Raiz";
}
