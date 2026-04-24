"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, Link } from "@/navigation";
import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sidebar, type SidebarItem } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { Loading } from "@/components/ui/loading";
import { PaywallProvider } from "@/contexts/paywall-context";
import { OfferManager } from "@/components/offers/offer-manager";
import {
  LayoutDashboard,
  User,
  Search,
  Heart,
  MessageCircle,
  CreditCard,
  Settings,
  Plane,
  Coffee,
  Crown,
  ShoppingBag,
} from "lucide-react";

// Removed static userMenuItems to define them inside AppLayout with translations

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession() || {};
  const t = useTranslations('Common');
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userMenuItems: SidebarItem[] = [
    { label: t('dashboard'), href: "/app", icon: LayoutDashboard },
    { label: t('profile'), href: "/app/perfil", icon: User },
    { label: t('discover'), href: "/app/descobrir", icon: Search },
    { label: t('conversations'), href: "/app/conversas", icon: MessageCircle },
    { label: t('connections'), href: "/app/matches", icon: Heart },
    { label: t('travel'), href: "/app/passaporte", icon: Plane },
    { label: t('go_out_today'), href: "/app/sair-hoje", icon: Coffee },
    { label: t('subscription'), href: "/app/assinatura", icon: CreditCard },
    { label: t('purchases'), href: "/app/compras", icon: ShoppingBag },
    { label: t('plans'), href: "/app/planos", icon: Crown },
    { label: t('settings'), href: "/app/configuracoes", icon: Settings },
  ];

  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fecha o menu mobile automaticamente ao trocar de página
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const fetchUnreadCount = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/chat/unread-count");
      const data = await res.json();
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [status]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // Polling cada 15s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
    // Redirect admins to their dashboards only if they hit the root /app
    if (status === "authenticated" && pathname === "/app") {
      if (session?.user?.role === "SUPERADMIN") {
        router.replace("/superadmin");
      } else if (session?.user?.role === "ADMIN") {
        router.replace("/admin");
      }
    }
  }, [status, session, router, pathname]);

  const isAdminRedirectNeeded = status === "authenticated" && pathname === "/app" && (session?.user?.role === "SUPERADMIN" || session?.user?.role === "ADMIN");

  if (status === "loading" || isAdminRedirectNeeded) {
    return <Loading fullScreen text={t('loading')} />;
  }

  if (!session) {
    return null;
  }

  const baseHref = session?.user?.role === "SUPERADMIN" ? "/superadmin" : session?.user?.role === "ADMIN" ? "/admin" : "/app";

  const dynamicMenuItems = userMenuItems.map(item => {
    let newItem = { ...item };
    if (item.href === "/app") newItem.href = baseHref;
    if (item.href === "/app/conversas" && unreadCount > 0) newItem.badge = unreadCount;
    return newItem;
  });


  return (
    <PaywallProvider>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col relative">
        {/* Mobile Safe Area Bars */}
        <div className="h-[env(safe-area-inset-top)] bg-gradient-brand w-full fixed top-0 left-0 z-[100] lg:hidden" />
        <div className="h-[env(safe-area-inset-bottom)] bg-neutral-900 w-full fixed bottom-0 left-0 z-[100] lg:hidden" />

        <Sidebar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          items={dynamicMenuItems}
          logo={
            <Link href={baseHref} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg">
                <span className="text-gradient">Ever</span>
                <span className="text-neutral-900 dark:text-white">NOW</span>
              </span>
            </Link>
          }
        />
        <div className="lg:pl-64 min-h-screen flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <Header onMenuClick={() => setMobileOpen(true)} />
          <OfferManager />
          <motion.main 
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 p-4 lg:p-8 w-full max-w-7xl mx-auto"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </PaywallProvider>
  );
}
