"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  BarChart3,
  Sparkles,
  Settings,
  Building2,
  BookOpen,
} from "lucide-react";
import { ThemePicker } from "@/components/layout/theme-picker";

const navItems = [
  {
    label: "LeadOwn",
    href: "/dashboard/leads",
    icon: Users,
    description: "Lead management",
  },
  {
    label: "DealPulse",
    href: "/dashboard/deals",
    icon: BarChart3,
    description: "Transaction tracking",
  },
  {
    label: "FlowDesk",
    href: "/dashboard/flowdesk",
    icon: Sparkles,
    description: "AI admin assistant",
  },
];

const settingsItems = [
  {
    label: "Settings",
    href: "/dashboard/settings/billing",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-slate-900">BrokerOS</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3 pb-4">
        <p className="px-2 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
          Modules
        </p>
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <div>
                <div>{item.label}</div>
                <div className="text-xs font-normal text-slate-400">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}

        <div className="mt-auto border-t border-slate-100">
          <div className="pt-3 px-2 pb-1">
            <a
              href="/guide.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              User guides
            </a>
          </div>
          <div className="pt-3">
            <ThemePicker />
          </div>
          <div className="border-t border-slate-100 pt-1 pb-1">
            {settingsItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg pl-[50px] pr-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
}
