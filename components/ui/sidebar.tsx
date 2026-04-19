"use client";

import * as React from "react";
import { Link, usePathname } from "@/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronLeft, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface SidebarProps {
  items: SidebarItem[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Sidebar({ items, logo, footer }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-neutral-800 shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300 flex flex-col",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
          {!collapsed && logo}
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 hidden lg:block"
          >
            <ChevronLeft
              className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items?.map((item) => {
            const isActive = item.href === "/app" || item.href === "/admin" || item.href === "/superadmin"
              ? pathname === item.href
              : pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-brand text-white shadow-md"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors",
                        isActive 
                          ? "bg-white text-indigo-600" 
                          : "bg-purple-600 text-white"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {footer && !collapsed && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
