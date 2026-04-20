"use client";

import * as React from "react";
import { Link } from "@/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Settings, LogOut, User, ChevronDown, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { data: session } = useSession() || {};
  const t = useTranslations('Common');
  const nt = useTranslations('Notifications');
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = React.useState<any[]>([]);

  const translateNotification = React.useCallback((notif: any) => {
    const type = notif.type?.toUpperCase();
    const data = notif.data || {};
    const name = data.userName || notif.title?.split(' ').pop() || t('someone');

    switch (type) {
      case 'MATCH':
        return {
          title: nt('new_match_title'),
          message: nt('new_match_message', { name })
        };
      case 'LIKE':
      case 'CURTIDA':
        return {
          title: nt('like_received_title'),
          message: nt('like_received_message')
        };
      case 'SUPERLIKE':
        return {
          title: nt('super_like_title'),
          message: nt('super_like_message', { name })
        };
      case 'MESSAGE':
      case 'MENSAGEM':
        return {
          title: nt('new_message_title', { name }),
          message: nt('new_message_message')
        };
      default:
        return { title: notif.title, message: notif.message };
    }
  }, [nt, t]);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = React.useCallback(async (isInitial = false) => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        // Se for polling e houver novas notificações não lidas
        if (!isInitial) {
          const newNotifs = data.notifications.filter((n: any) => 
            !n.read && !notifications.some(existing => existing.id === n.id)
          );
          
          newNotifs.forEach((n: any) => {
            const translated = translateNotification(n);
            toast.info(translated.title, {
              description: translated.message,
              action: n.data?.link ? {
                label: t('view'),
                onClick: () => window.location.href = n.data.link
              } : undefined
            });
          });
        }
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [session, notifications]);

  React.useEffect(() => {
    fetchNotifications(true);
    
    // Polling a cada 10 segundos para novas notificações
    const interval = setInterval(() => fetchNotifications(), 10000);
    return () => clearInterval(interval);
  }, [session, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/read", { method: "POST" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <header
      className={cn(
        "h-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50",
        className
      )}
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-8">
        {/* Left side - can add breadcrumbs or search */}
        <div className="flex-1" />

        {/* Right side - notifications and profile */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => {
                const currentTheme = theme === "system" ? resolvedTheme : theme;
                setTheme(currentTheme === "dark" ? "light" : "dark");
              }}
              className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
              title={t('theme_toggle')}
            >
              {(theme === "system" ? resolvedTheme : theme) === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-purple-600 rounded-full" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{t('notifications')}</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary hover:underline"
                    >
                      {t('mark_all_read')}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-neutral-500">
                      {t('no_notifications')}
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={cn(
                          "px-4 py-3 border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer relative flex gap-3",
                          !notif.read && "bg-primary/5 dark:bg-primary/10"
                        )}
                        onClick={() => {
                          if (notif.data?.link) window.location.href = notif.data.link;
                        }}
                      >
                        {!notif.read && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 bg-primary rounded-full" />
                        )}
                        
                        <Avatar 
                          src={notif.data?.avatarUrl} 
                          name={notif.title}
                          size="sm"
                          className="flex-shrink-0 mt-0.5"
                        />

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm text-neutral-900 dark:text-white truncate",
                            !notif.read ? "font-bold" : "font-medium"
                          )}>{translateNotification(notif).title}</p>
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{translateNotification(notif).message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Avatar
                src={session?.user?.image}
                name={session?.user?.name}
                size="sm"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {session?.user?.name || t('user')}
                </p>
                <p className="text-xs text-neutral-500">
                  {session?.user?.planSlug === "premium" ? t('premium') : t('free')}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                {session?.user?.role !== "SUPERADMIN" && session?.user?.role !== "ADMIN" && (
                  <>
                    <Link
                      href="/app/perfil"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                    >
                      <User className="h-4 w-4" />
                      {t('my_profile')}
                    </Link>
                    <Link
                      href="/app/configuracoes"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                    >
                      <Settings className="h-4 w-4" />
                      {t('settings')}
                    </Link>
                    <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                  </>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
