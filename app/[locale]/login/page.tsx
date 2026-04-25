"use client";

import { useState } from "react";
import { Link, useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, AlertCircle, Heart } from "lucide-react";
import { isValidEmail } from "@/lib/utils";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('Auth');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/app";
  const error = searchParams?.get("error");

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};
    if (!formData.email) {
      newErrors.email = t('error_email_required');
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t('error_email_invalid');
    }
    if (!formData.password) {
      newErrors.password = t('error_password_required');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({ general: result.error });
      } else {
        // Fetch session to determine role-based redirect
        const session = await getSession();
        const role = (session?.user as any)?.role;
        const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
        // If a specific callbackUrl was given (not the default /app), respect it
        const hasCustomCallback = callbackUrl !== '/app';
        if (hasCustomCallback) {
          router.replace(callbackUrl);
        } else if (isAdmin) {
          router.replace('/app');
        } else {
          router.replace('/app/descobrir');
        }
      }
    } catch {
      setErrors({ general: t('error_general') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 dark:bg-primary-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-400/20 dark:bg-secondary-600/10 blur-3xl pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          <div className="flex flex-col items-center justify-center mb-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-12 w-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform duration-300">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tight">
                <span className="text-gradient">Ever</span>
                <span className="text-neutral-900 dark:text-white">NOW</span>
              </span>
            </Link>
          </div>

          <Card className="w-full border-none shadow-2xl shadow-black/5 dark:shadow-black/40 rounded-[2rem] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-brand opacity-80" />
            
            <CardHeader className="text-center pt-8 pb-2">
              <CardTitle className="text-2xl font-black text-neutral-900 dark:text-white">{t('login_title')}</CardTitle>
              <CardDescription className="text-sm font-medium mt-2">{t('login_subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {(errors.general || error) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-error text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errors.general || t('error_auth')}</span>
                </div>
              )}

              <Input
                type="email"
                label={t('email_label')}
                placeholder={t('email_placeholder')}
                icon={<Mail className="h-4 w-4" />}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                disabled={loading}
              />

              <Input
                type="password"
                label={t('password_label')}
                placeholder={t('password_placeholder')}
                icon={<Lock className="h-4 w-4" />}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                disabled={loading}
              />

              <div className="flex justify-end">
                <Link href="/recuperar-senha" className="text-sm text-primary-600 hover:underline">
                  {t('forgot_password')}
                </Link>
              </div>

              <Button type="submit" className="w-full bg-gradient-brand hover:opacity-90 text-white font-bold h-12 rounded-xl shadow-md transition-all active:scale-[0.98]" loading={loading}>
                {t('login_btn')}
              </Button>

              <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                {t('no_account')}{" "}
                <Link href="/cadastro" className="text-primary-600 font-medium hover:underline">
                  {t('register_link')}
                </Link>
              </p>
            </form>
          </CardContent>
          </Card>
        </motion.div>
      </main>
      <footer className="py-6 text-center text-xs font-medium text-neutral-500 relative z-10">
        © 2026 EverNOW. {t('footer_rights')}
      </footer>
    </div>
  );
}
