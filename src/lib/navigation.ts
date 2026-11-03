export const navigation = [
  { href: "/", label: "Overview" },
  { href: "/applicants", label: "Applicants" },
  { href: "/jobs", label: "Jobs" },
  { href: "/analytics", label: "Analytics" },
] as const;

export type NavItem = (typeof navigation)[number];

export function sectionTitleForPath(pathname: string): string {
  const match = navigation.find((item) => item.href === pathname);
  return match?.label ?? "Screenline";
}
