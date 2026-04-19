"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle, CheckCircle, Heart } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { checkPasswordStrength } from "@/lib/utils";

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState<{ score: number; feedback: string[] }>({ score: 0, feedback: [] });

  useEffect(() => {
    setStrength(checkPasswordStrength(password));
  }, [password]);

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Link Inválido</h2>
          <p className="text-neutral-600 mb-6">Este link de recuperação é inválido ou já expirou.</p>
          <Link href="/recuperar-senha">
            <Button className="w-full">Solicitar novo link</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao redefinir senha");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Nova Senha</CardTitle>
        <CardDescription>Crie uma senha forte para sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold">Senha alterada!</h3>
            <p className="text-sm text-gray-500">Você será redirecionado para o login em instantes...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  className="pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`flex-1 rounded-full ${i <= strength.score ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {strength.score < 3 ? "Senha fraca" : strength.score < 5 ? "Senha média" : "Senha forte"}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  className="pl-9"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? "Processando..." : "Redefinir Senha"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col items-center justify-center p-4">
      <header className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">EverNOW</span>
        </Link>
      </header>

      <Suspense fallback={<Card className="w-full max-w-md h-[400px] flex items-center justify-center"><Loading /></Card>}>
        <RedefinirSenhaForm />
      </Suspense>

      <footer className="mt-8 text-sm text-gray-400">
        © 2026 EverNOW. Todos os direitos reservados.
      </footer>
    </div>
  );
}
