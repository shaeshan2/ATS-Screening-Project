export const navigation = [
  { href: "/", label: "Overview" },
  { href: "/applicants", label: "Applicants" },
  { href: "/jobs", label: "Jobs" },
  { href: "/analytics", label: "Analytics" },
] as const;

export type NavItem = (typeof navigation)[number];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function sectionTitleForPath(pathname: string): string {
  const match = navigation.find((item) => isNavItemActive(pathname, item.href));
  return match?.label ?? "Screenline";
}
