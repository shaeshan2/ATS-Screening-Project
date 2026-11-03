"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { navigation, sectionTitleForPath } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Briefcase,
  LayoutDashboard,
  Menu,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

const navIcons: Record<(typeof navigation)[number]["href"], LucideIcon> = {
  "/": LayoutDashboard,
  "/applicants": Users,
  "/jobs": Briefcase,
  "/analytics": BarChart3,
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const sectionTitle = sectionTitleForPath(pathname);

  useEffect(() => {
    if (!navOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNavOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  function openNavigation() {
    setNavOpen(true);
    requestAnimationFrame(() => firstLinkRef.current?.focus());
  }

  function closeNavigation(restoreFocus: boolean) {
    setNavOpen(false);
    if (restoreFocus) {
      menuButtonRef.current?.focus();
    }
  }

  return (
    <div className="relative flex min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-teal-700"
      >
        Skip to main content
      </a>

      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/40 md:hidden"
          aria-label="Close navigation"
          onClick={() => closeNavigation(true)}
        />
      ) : null}

      <aside
        id="primary-navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 shrink-0 flex-col bg-navy text-white md:static md:flex",
          navOpen ? "flex" : "hidden",
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-white/10 px-4">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-md bg-teal-400/15 text-sm font-semibold text-teal-100 ring-1 ring-teal-300/30"
            >
              S
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">Screenline</p>
              <p className="text-[11px] text-white/60">Applicant tracking</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close navigation"
            onClick={() => closeNavigation(true)}
          >
            <X />
          </Button>
        </div>

        <nav aria-label="Primary" className="px-3 py-4">
          <ul className="space-y-1">
            {navigation.map((item, index) => {
              const active = pathname === item.href;
              const Icon = navIcons[item.href];
              return (
                <li key={item.href}>
                  <Link
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setNavOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors",
                      "outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy",
                      active
                        ? "border-teal-300 bg-white/10 text-white"
                        : "border-transparent text-white/75 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <p className="mt-auto border-t border-white/10 px-4 py-4 text-xs leading-5 text-white/60">
          Demonstration workspace. Overview figures are sample records and are
          not stored.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <Button
            ref={menuButtonRef}
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
            aria-expanded={navOpen}
            aria-controls="primary-navigation"
            aria-label={navOpen ? "Close navigation" : "Open navigation"}
            onClick={() => (navOpen ? closeNavigation(false) : openNavigation())}
          >
            {navOpen ? <X /> : <Menu />}
          </Button>
          <h1 className="truncate text-base font-semibold tracking-tight text-slate-950">
            {sectionTitle}
          </h1>
          <Badge
            variant="outline"
            className="ml-auto shrink-0 border-teal-200 bg-teal-50 text-teal-800"
          >
            Demo workspace
          </Badge>
        </header>
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
