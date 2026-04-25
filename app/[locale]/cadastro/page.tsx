"use client";

import { useState } from "react";
import { Link, useRouter } from "@/navigation";
import { signIn, getSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Lock, AlertCircle, CheckCircle, Heart } from "lucide-react";
import { isValidEmail, checkPasswordStrength } from "@/lib/utils";

export default function CadastroPage() {
  const router = useRouter();
  const t = useTranslations('Auth');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const passwordStrength = checkPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = t('error_name_short');
    }
    if (!formData.email) {
      newErrors.email = t('error_email_required');
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t('error_email_invalid');
    }
    if (!formData.password) {
      newErrors.password = t('error_password_required');
    } else if (passwordStrength.score < 3) {
      newErrors.password = t('error_password_weak');
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('error_passwords_dont_match');
    }
    if (!formData.termsAccepted) {
      newErrors.terms = "Você deve aceitar os Termos de Uso e Política de Privacidade.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || t('error_register') });
        return;
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({ general: t('error_login_after_register') });
      } else {
        // New users always go to connections page
        const session = await getSession();
        const role = (session?.user as any)?.role;
        const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
        router.replace(isAdmin ? '/app' : '/app/descobrir');
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
            <CardTitle className="text-2xl">{t('register_title')}</CardTitle>
            <CardDescription>{t('register_subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-error text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              <Input
                type="text"
                label={t('name_label')}
                placeholder={t('name_placeholder')}
                icon={<User className="h-4 w-4" />}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                disabled={loading}
              />

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

              <div className="space-y-2">
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
                {formData.password && (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i <= passwordStrength.score
                            ? passwordStrength.score <= 2 ? "bg-error" : passwordStrength.score <= 3 ? "bg-warning" : "bg-success"
                            : "bg-neutral-200"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <Input
                type="password"
                label={t('confirm_password')}
                placeholder={t('password_placeholder')}
                icon={<CheckCircle className="h-4 w-4" />}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                disabled={loading}
              />

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="terms" 
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => setFormData({ ...formData, termsAccepted: checked as boolean })}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-xs font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-600 dark:text-neutral-400"
                  >
                    Eu li e concordo com os{" "}
                    <Link href="/termos" target="_blank" className="text-primary-600 hover:underline">
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link href="/privacidade" target="_blank" className="text-primary-600 hover:underline">
                      Política de Privacidade
                    </Link>
                    .
                  </label>
                  {errors.terms && (
                    <p className="text-[10px] text-error font-medium">{errors.terms}</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" loading={loading}>
                {t('register_btn')}
              </Button>

              <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                {t('have_account')}{" "}
                <Link href="/login" className="text-primary-600 font-medium hover:underline">
                  {t('login_link')}
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
