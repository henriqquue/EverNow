"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname, Link } from "@/navigation";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Settings,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Moon,
  Globe,
  Trash2,
  LogOut,
  Mail,
  Lock,
  Save,
  Loader2,
  CheckCircle,
  MapPin,
  Clock,
  UserCheck,
  Crown,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ResolvedField {
  fieldKey: string;
  label: string;
  isPublic: boolean;
  userCanChange: boolean;
  isRequired: boolean;
  reason?: string;
}

interface PrivacySettings {
  showOnlineStatus: boolean;
  showLastActive: boolean;
  showDistance: boolean;
  showAge: boolean;
  showReadReceipts: boolean;
  incognitoMode: boolean;
  verificationStatus: string;
}

export default function ConfiguracoesPage() {
  const { data: session } = useSession() || {};
  const t = useTranslations('Settings');
  const common = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Password state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Visibility state
  const [visibilityFields, setVisibilityFields] = useState<ResolvedField[]>([]);
  const [visibilityLoading, setVisibilityLoading] = useState(true);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [visibilityDirty, setVisibilityDirty] = useState(false);
  const [visibilityMsg, setVisibilityMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Privacy state
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [privacyLoading, setPrivacyLoading] = useState(true);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacyDirty, setPrivacyDirty] = useState(false);
  const [privacyMsg, setPrivacyMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [incognitoEntitled, setIncognitoEntitled] = useState(false);
  const [readReceiptsEntitled, setReadReceiptsEntitled] = useState(false);

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    notifyMatches: true,
    notifyMessages: true,
    notifyLikes: true,
    notifyMarketing: false,
  });
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifDirty, setNotifDirty] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchVisibility = useCallback(async () => {
    try {
      setVisibilityLoading(true);
      const res = await fetch("/api/profile/visibility");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVisibilityFields(data.fields || []);
    } catch {
      // silent — will show empty
    } finally {
      setVisibilityLoading(false);
    }
  }, []);

  const fetchPrivacy = useCallback(async () => {
    try {
      setPrivacyLoading(true);
      const res = await fetch("/api/privacy");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPrivacy(data.settings);
      setIncognitoEntitled(data.entitlements?.incognito ?? false);
      setReadReceiptsEntitled(data.entitlements?.readReceipts ?? true);
    } catch {
      // silent
    } finally {
      setPrivacyLoading(false);
    }
  }, []);

  const fetchNotifPrefs = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await fetch("/api/notifications/preferences");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.preferences) setNotifPrefs(data.preferences);
    } catch {
      // silent
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const saveNotifPrefs = async () => {
    setNotifSaving(true);
    setNotifMsg(null);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifPrefs),
      });
      if (!res.ok) throw new Error();
      setNotifDirty(false);
      setNotifMsg({ type: "success", text: t('save_success') });
    } catch {
      setNotifMsg({ type: "error", text: common('error') });
    } finally {
      setNotifSaving(false);
    }
  };

  const toggleNotif = (key: string, value: boolean) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: value }));
    setNotifDirty(true);
    setNotifMsg(null);
  };

  useEffect(() => {
    if (mounted) {
      fetchVisibility();
      fetchPrivacy();
      fetchNotifPrefs();
    }
  }, [mounted, fetchVisibility, fetchPrivacy, fetchNotifPrefs]);

  const toggleVisibility = (fieldKey: string, value: boolean) => {
    setVisibilityFields((prev) =>
      prev.map((f) => (f.fieldKey === fieldKey ? { ...f, isPublic: value } : f))
    );
    setVisibilityDirty(true);
    setVisibilityMsg(null);
  };

  const saveVisibility = async () => {
    try {
      setVisibilitySaving(true);
      setVisibilityMsg(null);
      const choices = visibilityFields
        .filter((f) => f.userCanChange)
        .map((f) => ({ fieldKey: f.fieldKey, isPublic: f.isPublic }));
      const res = await fetch("/api/profile/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choices }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || common('error'));
      }
      setVisibilityDirty(false);
      setVisibilityMsg({ type: "success", text: t('save_success') });
      setTimeout(() => setVisibilityMsg(null), 3000);
    } catch (err: unknown) {
      setVisibilityMsg({ type: "error", text: err instanceof Error ? err.message : common('error') });
    } finally {
      setVisibilitySaving(false);
    }
  };

  const updatePrivacy = (key: keyof PrivacySettings, value: boolean) => {
    setPrivacy((prev) => prev ? { ...prev, [key]: value } : prev);
    setPrivacyDirty(true);
    setPrivacyMsg(null);
  };

  const savePrivacy = async () => {
    if (!privacy) return;
    try {
      setPrivacySaving(true);
      setPrivacyMsg(null);
      const res = await fetch("/api/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showOnlineStatus: privacy.showOnlineStatus,
          showLastActive: privacy.showLastActive,
          showDistance: privacy.showDistance,
          showAge: privacy.showAge,
          showReadReceipts: privacy.showReadReceipts,
          incognitoMode: privacy.incognitoMode,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || common('error'));
      }
      setPrivacyDirty(false);
      setPrivacyMsg({ type: "success", text: t('save_success') });
      setTimeout(() => setPrivacyMsg(null), 3000);
    } catch (err: unknown) {
      setPrivacyMsg({ type: "error", text: err instanceof Error ? err.message : common('error') });
    } finally {
      setPrivacySaving(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('fill_all_fields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwords_dont_match'));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t('password_too_short'));
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('change_password_error'));
      }

      // Senha trocada com sucesso, deslogar usuário
      signOut({ callbackUrl: "/login?message=senha_alterada" });
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : t('change_password_error'));
      setPasswordLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          <Settings className="w-7 h-7 text-purple-600" />
          {t('title')}
        </h1>
        <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary-500" />
              {t('account')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Email"
              value={session?.user?.email || ""}
              disabled
              icon={<Mail className="h-4 w-4" />}
            />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{t('password')}</p>
                <p className="text-sm text-neutral-500">{t('change_password')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsPasswordModalOpen(true)}>
                <Lock className="h-4 w-4 mr-1" /> {t('change')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary-500" />
                {t('notifications')}
              </CardTitle>
              {notifDirty && (
                <Button
                  size="sm"
                  onClick={saveNotifPrefs}
                  disabled={notifSaving}
                  className="bg-gradient-brand text-white"
                >
                  {notifSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  {common('save')}
                </Button>
              )}
            </div>
            {notifMsg && (
              <div
                className={`mt-2 text-sm flex items-center gap-1 ${
                  notifMsg.type === "success"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {notifMsg.type === "success" && <CheckCircle className="h-3.5 w-3.5" />}
                {notifMsg.text}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {notifLoading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">{common('loading')}</div>
            ) : (
              [
                { key: "notifyMatches", label: t('notif_matches') },
                { key: "notifyMessages", label: t('notif_messages') },
                { key: "notifyLikes", label: t('notif_likes') },
                { key: "notifyMarketing", label: t('notif_marketing') },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <span className="text-neutral-700 dark:text-neutral-300">{item.label}</span>
                  <Switch
                    checked={!!notifPrefs[item.key]}
                    onCheckedChange={(v) => toggleNotif(item.key, v)}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Visibility — Real governance controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary-500" />
                {t('visibility')}
              </CardTitle>
              {visibilityDirty && (
                <Button
                  size="sm"
                  onClick={saveVisibility}
                  disabled={visibilitySaving}
                  className="bg-gradient-brand text-white"
                >
                  {visibilitySaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  {common('save')}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('visibility_desc')}
            </p>
            {visibilityMsg && (
              <div
                className={`mt-2 text-sm flex items-center gap-1 ${
                  visibilityMsg.type === "success"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {visibilityMsg.type === "success" && <CheckCircle className="h-3.5 w-3.5" />}
                {visibilityMsg.text}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-1">
            {visibilityLoading ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                {common('loading')}
              </div>
            ) : visibilityFields.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                {t('no_visibility_rules')}
              </div>
            ) : (
              visibilityFields.map((field) => (
                <div
                  key={field.fieldKey}
                  className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-white text-sm">
                        {field.label}
                      </span>
                      {field.isRequired && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          <Lock className="h-2.5 w-2.5 mr-0.5" /> {t('visibility_required')}
                        </Badge>
                      )}
                      {!field.userCanChange && !field.isRequired && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          <Shield className="h-2.5 w-2.5 mr-0.5" /> {t('visibility_admin')}
                        </Badge>
                      )}
                    </div>
                    {field.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5">{field.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {field.isPublic ? (
                      <Eye className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <Switch
                      checked={field.isPublic}
                      onCheckedChange={(v) => toggleVisibility(field.fieldKey, v)}
                      disabled={!field.userCanChange}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacy Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-500" />
                {t('privacy')}
              </CardTitle>
              {privacyDirty && (
                <Button
                  size="sm"
                  onClick={savePrivacy}
                  disabled={privacySaving}
                  className="bg-gradient-brand text-white"
                >
                  {privacySaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  {common('save')}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('privacy_desc')}
            </p>
            {privacyMsg && (
              <div
                className={`mt-2 text-sm flex items-center gap-1 ${
                  privacyMsg.type === "success"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {privacyMsg.type === "success" && <CheckCircle className="h-3.5 w-3.5" />}
                {privacyMsg.text}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-1">
            {privacyLoading || !privacy ? (
              <div className="py-6 text-center text-muted-foreground text-sm">{common('loading')}</div>
            ) : (
              <>
                {/* Verification status */}
                <div className="flex items-center justify-between py-3 px-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-blue-500" />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{t('verification_status')}</span>
                      <p className="text-[10px] text-muted-foreground">{t('verification_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "text-[10px] font-bold px-2 py-0.5",
                      privacy.verificationStatus === "VERIFIED" ? "bg-green-500 text-white" : 
                      privacy.verificationStatus === "PENDING" ? "bg-amber-500 text-white" : 
                      privacy.verificationStatus === "REJECTED" ? "bg-red-500 text-white" :
                      "bg-neutral-200 text-neutral-600 dark:bg-neutral-800"
                    )}>
                      {privacy.verificationStatus === "VERIFIED" ? t('verified') : 
                       privacy.verificationStatus === "PENDING" ? t('pending') : 
                       privacy.verificationStatus === "REJECTED" ? t('rejected') :
                       t('not_verified')}
                    </Badge>
                    {privacy.verificationStatus !== "VERIFIED" && privacy.verificationStatus !== "PENDING" && (
                      <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 group">
                        <Link href="/app/verificacao" className="flex items-center gap-1 font-bold">
                          {t('verify_now')} <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Online status */}
                <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-white text-sm">{t('show_online')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('show_online_desc')}</p>
                  </div>
                  <Switch
                    checked={privacy.showOnlineStatus}
                    onCheckedChange={(v) => updatePrivacy("showOnlineStatus", v)}
                  />
                </div>

                {/* Last active */}
                <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-white text-sm">{t('show_activity')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('show_activity_desc')}</p>
                  </div>
                  <Switch
                    checked={privacy.showLastActive}
                    onCheckedChange={(v) => updatePrivacy("showLastActive", v)}
                  />
                </div>

                {/* Distance */}
                <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-white text-sm">{t('show_distance')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('show_distance_desc')}</p>
                  </div>
                  <Switch
                    checked={privacy.showDistance}
                    onCheckedChange={(v) => updatePrivacy("showDistance", v)}
                  />
                </div>

                {/* Age */}
                <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-white text-sm">{t('show_age')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('show_age_desc')}</p>
                  </div>
                  <Switch
                    checked={privacy.showAge}
                    onCheckedChange={(v) => updatePrivacy("showAge", v)}
                  />
                </div>

                {/* Read receipts */}
                <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-white text-sm">{t('read_receipts')}</span>
                      <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">
                        <Crown className="h-2.5 w-2.5 mr-0.5" /> {common('premium')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('read_receipts_desc')}</p>
                  </div>
                  <Switch
                    checked={privacy.showReadReceipts}
                    onCheckedChange={(v) => updatePrivacy("showReadReceipts", v)}
                    disabled={!readReceiptsEntitled && !privacy.showReadReceipts}
                  />
                </div>

                {/* Incognito mode */}
                <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-white text-sm">{t('incognito')}</span>
                      <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">
                        <Crown className="h-2.5 w-2.5 mr-0.5" /> {common('premium')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('incognito_desc')}</p>
                  </div>
                  <Switch
                    checked={privacy.incognitoMode}
                    onCheckedChange={(v) => updatePrivacy("incognitoMode", v)}
                    disabled={!incognitoEntitled && !privacy.incognitoMode}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary-500" />
              {t('preferences')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label={t('language')}
              options={[
                { value: "pt", label: "Português" },
                { value: "en", label: "English" },
                { value: "es", label: "Español" },
              ]}
              value={locale}
              onChange={(newLocale) => {
                router.replace(pathname, { locale: newLocale });
              }}
            />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{t('dark_mode')}</p>
                <p className="text-sm text-neutral-500">{t('dark_mode_desc')}</p>
              </div>
              <Switch
                checked={mounted && (resolvedTheme === "dark")}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-error/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error">
              <Trash2 className="h-5 w-5" />
              {t('danger_zone')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{t('sign_out')}</p>
                <p className="text-sm text-neutral-500">{t('sign_out_desc')}</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" /> {common('logout')}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{t('delete_account')}</p>
                <p className="text-sm text-neutral-500">{t('delete_account_desc')}</p>
              </div>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" /> {t('delete')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('change_password')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="text-sm font-medium text-error bg-error/10 p-3 rounded-md">
                {passwordError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{t('current_password')}</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('current_password_placeholder')}
                disabled={passwordLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{t('new_password')}</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('new_password_placeholder')}
                disabled={passwordLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{t('confirm_password')}</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                disabled={passwordLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={passwordLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="bg-gradient-brand text-white"
            >
              {passwordLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</>
              ) : (
                "Trocar Senha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
