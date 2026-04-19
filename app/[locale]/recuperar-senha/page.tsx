"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, CheckCircle, ArrowLeft, Heart } from "lucide-react";
import { isValidEmail } from "@/lib/utils";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email é obrigatório");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Email inválido");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao enviar email");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erro ao enviar email. Tente novamente.");
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
        {success ? (
          <Card className="w-full max-w-md">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Email enviado!</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Se existe uma conta com o email informado, você receberá um link para redefinir sua senha.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4" /> Voltar ao login
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Recuperar senha</CardTitle>
              <CardDescription>Digite seu email para receber um link de recuperação</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-error text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  type="email"
                  label="Email"
                  placeholder="seu@email.com"
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />

                <Button type="submit" className="w-full" loading={loading}>
                  Enviar link de recuperação
                </Button>

                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4" /> Voltar ao login
                  </Button>
                </Link>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="p-4 text-center text-sm text-neutral-500">
        © 2026 EverNOW. Todos os direitos reservados.
      </footer>
    </div>
  );
}
