const PAGE_TITLES: { match: string | RegExp; title: string }[] = [
  { match: "/team/invite", title: "Invite team member" },
  { match: "/team", title: "Team members" },
  { match: /^\/$/, title: "Dashboard" },
  { match: "/transactions", title: "Transactions" },
  { match: "/customers", title: "Customers" },
  { match: "/analytics", title: "Analytics" },
  { match: "/invoice/create-new", title: "New Invoice" },
  { match: /^\/invoice\/[^/]+\/edit/, title: "Edit Invoice" },
  { match: /^\/invoice\/[^/]+$/, title: "Invoice" },
  { match: "/invoice", title: "Invoices" },
  { match: "/bill-requests", title: "Bill Requests" },
  { match: "/gateway/settings", title: "Gateway Settings" },
  { match: "/gateway/settlement", title: "Remittance Settlement" },
  { match: /^\/gateway\/[^/]+$/, title: "Subaccount" },
  { match: "/gateway", title: "Gateway" },
  { match: "/developers", title: "Gateway" },
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
