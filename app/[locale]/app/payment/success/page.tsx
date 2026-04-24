"use client";

import { useEffect } from "react";
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-none overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-green-600 p-8 text-white text-center relative overflow-hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="relative z-10"
            >
              <CheckCircle className="w-20 h-20 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-3xl font-black uppercase tracking-tight relative z-10">Sucesso!</h1>
            <p className="text-green-100 font-medium relative z-10">Seu pagamento foi processado com êxito.</p>
            
            {/* Background pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <Sparkles className="w-full h-full scale-150" />
            </div>
          </div>

          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                <p className="text-sm font-bold text-green-800">
                  Obrigado por sua compra! Seus itens/plano já foram ativados em sua conta.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full h-12 bg-neutral-900 hover:bg-black text-white font-black uppercase tracking-tighter"
                  onClick={() => router.push("/app")}
                >
                  Ir para o Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full gap-2 font-bold text-muted-foreground"
                  onClick={() => router.push("/app/compras")}
                >
                  Ver Histórico de Compras
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
