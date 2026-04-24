"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  Shield, 
  CreditCard, 
  Lock, 
  Plus, 
  CircleDot, 
  Wallet,
  Smartphone,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MockCard {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
}

export default function MockCheckoutPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const router = useRouter();
  
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Payment Method States
  const [savedCards, setSavedCards] = useState<MockCard[]>([
    { id: "1", brand: "Mastercard", last4: "4242", expiry: "12/28" }
  ]);
  const [selectedMethod, setSelectedMethod] = useState<string>("1");
  const [showAddCard, setShowAddCard] = useState(false);
  
  // New Card Form State
  const [newCard, setNewCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      try {
        const res = await fetch(`/api/payment/session/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSessionData(data);
        } else {
          setError("Sessão de pagamento expirada ou inválida");
        }
      } catch (err) {
        setError("Erro ao carregar detalhes do pagamento");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const handlePay = async () => {
    if (!sessionId) return;
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/payment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId,
          paymentMethodId: selectedMethod 
        }),
      });

      if (res.ok) {
        const successUrl = sessionData.session.successUrl.replace('{CHECKOUT_SESSION_ID}', sessionId);
        router.push(successUrl);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao processar pagamento");
      }
    } catch (err) {
      setError("Falha na conexão com o servidor");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    if (sessionData?.session?.cancelUrl) {
      router.push(sessionData.session.cancelUrl);
    } else {
      router.back();
    }
  };

  const handleAddCard = () => {
    // Basic mock validation
    if (newCard.number.length < 16) return;
    
    const id = Math.random().toString(36).substr(2, 9);
    const brand = newCard.number.startsWith('4') ? 'Visa' : 'Mastercard';
    const card: MockCard = {
      id,
      brand,
      last4: newCard.number.slice(-4),
      expiry: newCard.expiry
    };
    
    setSavedCards([...savedCards, card]);
    setSelectedMethod(id);
    setShowAddCard(false);
    setNewCard({ number: "", name: "", expiry: "", cvv: "" });
  };

  if (loading && sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loading text="Preparando ambiente seguro..." />
      </div>
    );
  }

  if (!sessionId || (!sessionData && !loading)) {
    return <div className="p-10 text-center">Sessão inválida</div>;
  }

  const getItemPrice = () => {
    if (!sessionData?.item) return 0;
    if (sessionData.session.type === "SUBSCRIPTION") {
      const interval = sessionData.item.planIntervals?.find((i: any) => i.interval === sessionData.session.interval);
      return interval?.discountPrice || interval?.price || sessionData.item.price;
    }
    return sessionData.item.price;
  };

  const itemName = sessionData?.item?.name || "Item Indisponível";
  const price = getItemPrice();

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-none">
        <CardHeader className="bg-indigo-600 text-white rounded-t-2xl pb-8 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl" />
          
          <div className="flex justify-center mb-4 relative z-10">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <Shield className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-black uppercase tracking-tight relative z-10">Checkout Seguro</CardTitle>
          <p className="text-center text-indigo-100 text-sm font-medium relative z-10">EverNOW Pay • Ambiente de Testes</p>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-8 space-y-6 -mt-4 bg-white rounded-2xl relative z-20">
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-2">
              <div className="flex justify-between text-[10px] font-black text-indigo-900/60 uppercase tracking-widest">
                <span>{itemName}</span>
                <span>#{sessionId.slice(0, 6)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-indigo-100/30">
                <span className="font-bold text-neutral-700">Total a Pagar</span>
                <span className="text-2xl font-black text-indigo-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
                </span>
              </div>
            </div>

            {/* Payment Methods Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Método de Pagamento</p>
                <button 
                  onClick={() => setShowAddCard(true)}
                  className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus size={12} />
                  Adicionar Novo
                </button>
              </div>

              <div className="space-y-2">
                {/* Saved Cards */}
                {savedCards.map((card) => (
                  <div 
                    key={card.id}
                    onClick={() => setSelectedMethod(card.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all",
                      selectedMethod === card.id 
                        ? "border-indigo-600 bg-indigo-50/30 shadow-sm" 
                        : "border-neutral-100 hover:border-indigo-200"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      selectedMethod === card.id ? "bg-indigo-600 text-white" : "bg-neutral-100 text-neutral-400"
                    )}>
                      <CreditCard size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-neutral-900">{card.brand} **** {card.last4}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">Expira em {card.expiry}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      selectedMethod === card.id ? "border-indigo-600" : "border-neutral-200"
                    )}>
                      {selectedMethod === card.id && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                  </div>
                ))}

                {/* Pix Option */}
                <div 
                  onClick={() => setSelectedMethod("pix")}
                  className={cn(
                    "flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all",
                    selectedMethod === "pix" 
                      ? "border-green-600 bg-green-50/30 shadow-sm" 
                      : "border-neutral-100 hover:border-green-200"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    selectedMethod === "pix" ? "bg-green-600 text-white" : "bg-neutral-100 text-neutral-400"
                  )}>
                    <Smartphone size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-neutral-900">Pix</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">Aprovação instantânea</p>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    selectedMethod === "pix" ? "border-green-600" : "border-neutral-200"
                  )}>
                    {selectedMethod === "pix" && <div className="w-2.5 h-2.5 bg-green-600 rounded-full" />}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 text-center flex items-center justify-center gap-2">
                <CircleDot size={14} className="fill-red-600" />
                {error}
              </div>
            )}

            <div className="pt-2 space-y-3">
              <Button 
                className={cn(
                  "w-full h-14 text-lg font-black uppercase tracking-tight shadow-xl transition-all active:scale-[0.98]",
                  selectedMethod === "pix" 
                    ? "bg-green-600 hover:bg-green-700 shadow-green-200" 
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                )}
                onClick={handlePay}
                disabled={processing}
              >
                {processing ? <Loading size="sm" /> : (
                  <div className="flex items-center justify-center gap-2">
                    {selectedMethod === "pix" ? "Gerar QR Code Pix" : "Finalizar Pagamento"}
                    <ChevronRight size={20} />
                  </div>
                )}
              </Button>

              <Button 
                variant="ghost"
                className="w-full text-xs font-bold text-muted-foreground uppercase tracking-widest hover:bg-red-50 hover:text-red-600 py-6 rounded-2xl"
                onClick={handleCancel}
                disabled={processing}
              >
                Cancelar e Voltar
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 rounded-full">
                <Lock size={12} className="text-neutral-400" />
                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">SSL 256-bit</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-2">
              <Plus size={24} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Novo Cartão</DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground">
              Insira os dados do seu cartão de crédito para salvar e prosseguir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label htmlFor="number" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Número do Cartão</Label>
              <Input 
                id="number" 
                placeholder="0000 0000 0000 0000" 
                maxLength={19}
                value={newCard.number}
                onChange={(e) => setNewCard({...newCard, number: e.target.value})}
                className="h-12 rounded-xl border-neutral-200 focus:ring-indigo-600"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Nome no Cartão</Label>
              <Input 
                id="name" 
                placeholder="COMO ESTÁ NO CARTÃO" 
                value={newCard.name}
                onChange={(e) => setNewCard({...newCard, name: e.target.value.toUpperCase()})}
                className="h-12 rounded-xl border-neutral-200 focus:ring-indigo-600 uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiry" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Validade</Label>
                <Input 
                  id="expiry" 
                  placeholder="MM/AA" 
                  maxLength={5}
                  value={newCard.expiry}
                  onChange={(e) => setNewCard({...newCard, expiry: e.target.value})}
                  className="h-12 rounded-xl border-neutral-200 focus:ring-indigo-600"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cvv" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">CVV</Label>
                <Input 
                  id="cvv" 
                  placeholder="123" 
                  maxLength={4}
                  value={newCard.cvv}
                  onChange={(e) => setNewCard({...newCard, cvv: e.target.value})}
                  className="h-12 rounded-xl border-neutral-200 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-tight rounded-2xl shadow-lg shadow-indigo-100"
              onClick={handleAddCard}
              disabled={newCard.number.length < 13}
            >
              Salvar Cartão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
