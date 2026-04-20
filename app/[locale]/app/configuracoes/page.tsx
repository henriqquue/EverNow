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
      // silent
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

      signOut({ callbackUrl: "/login?message=senha_alterada" });
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : t('change_password_error'));
      setPasswordLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 pb-24">
      <div className="flex items-center gap-3 pt-2">
        <div className="p-2 bg-indigo-600 rounded-xl shadow-glow">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-neutral-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-soft overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-neutral-800/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" /> {t('general')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
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
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{t('dark_mode')}</p>
                <p className="text-sm text-neutral-500">{t('dark_mode_desc')}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {resolvedTheme === "dark" ? (t('light_mode') || 'Light') : (t('dark_mode') || 'Dark')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visibility Settings */}
        <Card className="border-none shadow-soft overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-neutral-800/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" /> {t('profile_visibility')}
              </CardTitle>
              {visibilityDirty && (
                <Button 
                  size="sm" 
                  onClick={saveVisibility} 
                  disabled={visibilitySaving}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {visibilitySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {common('save')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {visibilityLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
            ) : (
              <div className="space-y-4">
                {visibilityMsg && (
                  <div className={cn("p-3 rounded-lg text-sm font-medium", 
                    visibilityMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                    {visibilityMsg.text}
                  </div>
                )}
                {visibilityFields.map((field) => (
                  <div key={field.fieldKey} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-100 dark:border-neutral-800">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{field.label}</p>
                      {field.reason && <p className="text-xs text-neutral-500">{field.reason}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {!field.userCanChange && (
                        <Badge variant="secondary" className="text-[10px] uppercase">{t('required')}</Badge>
                      )}
                      <Switch
                        disabled={!field.userCanChange || visibilitySaving}
                        checked={field.isPublic}
                        onCheckedChange={(val) => toggleVisibility(field.fieldKey, val)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="border-none shadow-soft overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-neutral-800/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" /> {t('privacy')}
              </CardTitle>
              {privacyDirty && (
                <Button 
                  size="sm" 
                  onClick={savePrivacy} 
                  disabled={privacySaving}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {privacySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {common('save')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {privacyLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
            ) : privacy ? (
              <div className="space-y-4">
                {privacyMsg && (
                  <div className={cn("p-3 rounded-lg text-sm font-medium", 
                    privacyMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                    {privacyMsg.text}
                  </div>
                )}
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{t('show_online_status')}</p>
                    <p className="text-xs text-neutral-500">{t('show_online_status_desc')}</p>
                  </div>
                  <Switch
                    checked={privacy.showOnlineStatus}
                    onCheckedChange={(val) => updatePrivacy('showOnlineStatus', val)}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{t('show_distance')}</p>
                    <p className="text-xs text-neutral-500">{t('show_distance_desc')}</p>
                  </div>
                  <Switch
                    checked={privacy.showDistance}
                    onCheckedChange={(val) => updatePrivacy('showDistance', val)}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{t('show_age')}</p>
                    <p className="text-xs text-neutral-500">{t('show_age_desc')}</p>
                  </div>
                  <Switch
                    checked={privacy.showAge}
                    onCheckedChange={(val) => updatePrivacy('showAge', val)}
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                          {t('incognito_mode')}
                          {!incognitoEntitled && <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">PRO</Badge>}
                        </p>
                        <p className="text-xs text-neutral-500">{t('incognito_mode_desc')}</p>
                      </div>
                    </div>
                    <Switch
                      disabled={!incognitoEntitled}
                      checked={privacy.incognitoMode}
                      onCheckedChange={(val) => updatePrivacy('incognitoMode', val)}
                    />
                  </div>
                  {!incognitoEntitled && (
                    <Link href="/assinatura" className="text-[10px] text-indigo-600 font-bold hover:underline">
                      {t('upgrade_to_use')}
                    </Link>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-none shadow-soft overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-neutral-800/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" /> {t('change_password')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>
              {t('change_password_button')}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-soft overflow-hidden border-red-100">
          <CardHeader className="border-b bg-red-50/30 dark:bg-red-900/10">
            <CardTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> {t('danger_zone')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-neutral-500">{t('delete_account_desc')}</p>
            <div className="flex gap-4">
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                {t('delete_account_button')}
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="w-4 h-4" /> {t('logout')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>{t('change_password')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium">
                {passwordError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('current_password')}</label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('new_password')}</label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('confirm_password')}</label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>{common('cancel')}</Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={passwordLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save_password')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
