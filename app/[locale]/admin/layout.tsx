"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { Loading } from "@/components/ui/loading";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  BarChart3,
  Shield,
  Lock,
} from "lucide-react";

const adminMenuItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Usuários", href: "/admin/usuarios", icon: Users },
  { label: "Moderação", href: "/admin/moderacao", icon: AlertTriangle },
  { label: "Relatórios", href: "/admin/relatorios", icon: BarChart3 },
  { label: "Configurações", href: "/admin/configuracoes", icon: Lock },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      router.replace("/app");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <Loading fullScreen text="Carregando..." />;
  }

  if (!session || (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar
        items={adminMenuItems}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        logo={
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-secondary-500 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">
              <span className="text-secondary-600">Admin</span>
            </span>
          </Link>
        }
      />
      <div className="lg:pl-64">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
