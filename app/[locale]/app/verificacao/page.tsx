"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Camera, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronLeft,
  AlertCircle,
  Loader2,
  Lock,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";

export default function VerificacaoPage() {
  const { data: session } = useSession();
  const t = useTranslations("Verification");
  const common = useTranslations("Common");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Info, 2: Upload
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/verification");
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchStatus();
    }
  }, [session?.user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setSubmitting(true);
    setMsg(null);

    try {
      // 1. Upload photo
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch("/api/verification/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error(t("error_upload"));
      const { url } = await uploadRes.json();

      // 2. Submit request
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PHOTO",
          photoUrl: url,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || t("error_request"));
      }

      setMsg({ type: "success", text: t("success_msg") });
      await fetchStatus();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-4 text-muted-foreground animate-pulse">{t("status_checking")}</p>
      </div>
    );
  }

  // If already verified
  if (status?.verificationStatus === "VERIFIED") {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-[40px] shadow-2xl">
              <ShieldCheck className="h-20 w-20 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-full border-4 border-white dark:border-neutral-900">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter">{t("verified_title")}</h1>
            <p className="text-muted-foreground text-lg">
              {t("verified_desc")}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-6">
            <Link href="/app/configuracoes" className="w-full">
              <Button size="lg" className="w-full rounded-full h-14 bg-blue-600 hover:bg-blue-700 font-bold">
                {t("back_settings")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // If pending
  if (status?.verificationStatus === "PENDING") {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-[32px] bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="h-12 w-12 animate-spin-slow" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-black tracking-tighter">{t("pending_title")}</h1>
            <p className="text-muted-foreground">
              {t("pending_desc")}
            </p>
          </div>

          <Card className="border-none bg-muted/40 backdrop-blur shadow-none rounded-[32px]">
            <CardContent className="p-6 text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-sm font-medium">{t("submitted_at")} {new Date(status.latestRequest?.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-muted-foreground italic">
                {t("pending_note")}
              </p>
            </CardContent>
          </Card>

          <Link href="/app/configuracoes">
            <Button variant="ghost" className="rounded-full">
              <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 pb-24">
      <Link 
        href="/app/configuracoes" 
        className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary-500 transition-colors mb-8 group"
      >
        <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" /> 
        {t("back_settings")}
      </Link>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="space-y-3">
              <Badge className="bg-blue-500/10 text-blue-600 border-none px-3 py-1 font-black uppercase tracking-widest text-[10px]">
                {t("security_trust")}
              </Badge>
              <h1 className="text-4xl font-black tracking-tighter leading-none">
                {t("verify_identity")}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t("description")}
              </p>
            </div>

            <div className="grid gap-4">
              {[
                { 
                  icon: ShieldCheck, 
                  title: t("benefits.badge_title"), 
                  desc: t("benefits.badge_desc"),
                  color: "bg-blue-500"
                },
                { 
                  icon: Zap, 
                  title: t("benefits.discovery_title"), 
                  desc: t("benefits.discovery_desc"),
                  color: "bg-amber-500"
                },
                { 
                  icon: Lock, 
                  title: t("benefits.security_title"), 
                  desc: t("benefits.security_desc"),
                  color: "bg-green-500"
                }
              ].map((benefit, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-[28px] bg-white/40 dark:bg-white/[0.03] border border-white/20 dark:border-white/10 backdrop-blur-xl">
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white", benefit.color)}>
                    <benefit.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-lg">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {status?.verificationStatus === "REJECTED" && (
              <div className="p-5 rounded-[28px] bg-red-500/10 border border-red-500/20 flex gap-4">
                <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-bold text-red-600">{t("rejected_title")}</h4>
                  <p className="text-sm text-red-500/80">{t("rejected_reason")} {status.latestRequest?.rejectionReason || t("no_reason")}</p>
                </div>
              </div>
            )}

            <Button 
              size="lg" 
              onClick={() => setStep(2)}
              className="w-full h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-600/20"
            >
              {t("start_btn")}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter">{t("take_selfie")}</h2>
              <p className="text-muted-foreground">
                {t("selfie_desc")}
              </p>
            </div>

            <div className="relative group">
              <div className={cn(
                "aspect-[3/4] rounded-[40px] border-4 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden relative",
                preview 
                  ? "border-blue-500/50 bg-muted" 
                  : "border-muted-foreground/20 hover:border-blue-500/50 bg-muted/30"
              )}>
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" onClick={() => { setPreview(null); setFile(null); }} className="rounded-full font-bold">
                        {t("change_photo")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-10 space-y-4">
                    <div className="h-20 w-20 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                      <Camera className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-lg">{t("click_upload")}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{t("upload_hint")}</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleFileChange}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {msg && (
                <div className={cn(
                  "p-4 rounded-2xl flex items-center gap-3 font-bold text-sm",
                  msg.type === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                )}>
                  {msg.type === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  {msg.text}
                </div>
              )}

              <Button 
                size="lg"
                disabled={!file || submitting}
                onClick={handleSubmit}
                className="w-full h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg shadow-xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    {t("processing")}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-6 w-6 mr-2" />
                    {t("finish_btn")}
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                disabled={submitting}
                onClick={() => setStep(1)}
                className="rounded-full"
              >
                {t("cancel")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
