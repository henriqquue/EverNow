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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex flex-col">
      <header className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-gradient">Ever</span>
            <span className="text-neutral-900 dark:text-white">NOW</span>
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('login_title')}</CardTitle>
            <CardDescription>{t('login_subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
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

              <Button type="submit" className="w-full" loading={loading}>
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
      </main>
      <footer className="p-4 text-center text-sm text-neutral-500">
        © 2026 EverNOW. {t('footer_rights')}
      </footer>
    </div>
  );
}
