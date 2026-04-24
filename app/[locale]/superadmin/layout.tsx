"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { Loading } from "@/components/ui/loading";
import {
  LayoutDashboard,
  Package,
  Puzzle,
  Zap,
  CreditCard,
  FileText,
  BarChart3,
  Crown,
  TrendingUp,
  Heart,
  Megaphone,
  Image,
  Globe,
  Ticket,
  MonitorPlay,
  UserCog,
  Shield,
} from "lucide-react";
import Link from "next/link";

const superadminMenuItems = [
  { label: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
  { label: "Comercial", href: "/superadmin/comercial", icon: TrendingUp },
  { label: "Campanhas", href: "/superadmin/campanhas", icon: Megaphone },
  { label: "Banners", href: "/superadmin/banners", icon: Image },
  { label: "Anúncios", href: "/superadmin/anuncios", icon: MonitorPlay },
  { label: "Cupons", href: "/superadmin/cupons", icon: Ticket },
  { label: "Landing Page", href: "/superadmin/landing", icon: Globe },
  { label: "Planos", href: "/superadmin/planos", icon: Package },
  { label: "Módulos", href: "/superadmin/modulos", icon: Puzzle },
  { label: "Funcionalidades", href: "/superadmin/funcionalidades", icon: Zap },
  { label: "Compatibilidade", href: "/superadmin/compatibilidade", icon: Heart },
  { label: "Assinaturas", href: "/superadmin/assinaturas", icon: CreditCard },
  { label: "CMS", href: "/superadmin/cms", icon: FileText },
  { label: "Métricas", href: "/superadmin/metricas", icon: BarChart3 },
  { label: "Perfil Governança", href: "/superadmin/perfil-governanca", icon: UserCog },
  { label: "LGPD", href: "/superadmin/lgpd", icon: Shield },
  { label: "Configurações", href: "/superadmin/configuracoes", icon: UserCog },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "SUPERADMIN") {
      router.replace("/app");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <Loading fullScreen text="Carregando..." />;
  }

  if (!session || session?.user?.role !== "SUPERADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar
        items={superadminMenuItems}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        logo={
          <Link href="/superadmin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">
              <span className="text-gradient">Super</span>
              <span className="text-neutral-900 dark:text-white">Admin</span>
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