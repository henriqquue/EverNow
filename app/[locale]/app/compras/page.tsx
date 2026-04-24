"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { 
  ShoppingBag, 
  History, 
  Sparkles,
  Zap,
  Star,
  Heart,
  Globe,
  Eye,
  RefreshCw,
  Check,
  X,
  Clock,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RadixTabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

import confetti from "canvas-confetti";

export default function ComprasPage() {
  const { data: session } = useSession();
  const t = useTranslations('Purchases');
  const common = useTranslations('Common');
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("store");
  const [purchases, setPurchases] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [activeBoosts, setActiveBoosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      const [purchasesRes, storeRes, boostsRes] = await Promise.all([
        fetch("/api/consumables/purchase"),
        fetch("/api/consumables"),
        fetch("/api/consumables/purchase/active")
      ]);

      if (purchasesRes.ok) {
        const data = await purchasesRes.json();
        setPurchases(data);
      }

      if (storeRes.ok) {
        const data = await storeRes.json();
        setStoreItems(data);
      }

      if (boostsRes.ok) {
        const data = await boostsRes.json();
        setActiveBoosts(data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  const handlePurchase = async (itemId: string) => {
    setPurchasingId(itemId);
    setMessage(null);
    try {
      // Create checkout session
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          itemId,
          type: "CONSUMABLE"
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to the mock checkout page
        if (data.url) {
          router.push(data.url);
        }
      } else {
        const errorData = await res.json();
        setMessage({ text: errorData.error || t('purchase_error'), type: 'error' });
      }
    } catch (error) {
      setMessage({ text: t('purchase_error'), type: 'error' });
    } finally {
      setPurchasingId(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loading /></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
            {t('title')}
          </h1>
          <p className="text-[10px] sm:text-sm font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
            {t('subtitle')}
          </p>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg",
                message.type === 'success' ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
              )}
            >
              {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RadixTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-8 w-full sm:w-fit flex">
          <TabsTrigger value="store" className="gap-2 flex-1 sm:flex-none px-4 sm:px-6">
            <Sparkles size={16} />
            {t('tab_store')}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 flex-1 sm:flex-none px-4 sm:px-6">
            <History size={16} />
            {t('tab_history')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="mt-0 outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {storeItems.map((item) => (
              <Card key={item.id} className={cn(
                "relative overflow-hidden border transition-all group flex flex-col h-full",
                item.isPopular ? "border-indigo-500/30 bg-indigo-50/5" : "border-neutral-200 dark:border-neutral-800"
              )}>
                {item.isPopular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg flex items-center gap-1 uppercase tracking-tighter">
                      <Star size={10} fill="currentColor" />
                      {t('popular_badge')}
                    </div>
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                    item.color ? `bg-${item.color}-100 text-${item.color}-600` : "bg-indigo-100 text-indigo-600"
                  )} style={item.color ? { backgroundColor: `${item.color}20`, color: item.color } : {}}>
                    {(() => {
                      const slug = item.slug;
                      if (slug.includes('boost')) return <Zap size={24} fill="currentColor" />;
                      if (slug.includes('superlike')) return <Star size={24} fill="currentColor" />;
                      if (slug.includes('spotlight')) return <Sparkles size={24} />;
                      if (slug.includes('unlimited')) return <Heart size={24} fill="currentColor" />;
                      if (slug.includes('travel')) return <Globe size={24} />;
                      if (slug.includes('who-liked')) return <Eye size={24} />;
                      if (slug.includes('reset')) return <RefreshCw size={24} />;
                      return <ShoppingBag size={24} />;
                    })()}
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-black leading-tight h-[48px] line-clamp-2">{item.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm h-[40px] line-clamp-2">{item.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 space-y-4">
                  {item.durationDays && (
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full w-fit">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {item.durationDays} dias de duração
                    </div>
                  )}

                  <div className="space-y-2 flex-1">
                    {Object.entries(item.benefits || {}).map(([key, value]: [string, any]) => {
                      // Tradução/Formatação amigável dos benefícios
                      let label = String(value);
                      if (value === true) {
                        const labels: Record<string, string> = {
                          priority_in_feed: t('benefit_priority'),
                          special_notification: t('benefit_special_notif'),
                          unlimited_likes: t('benefit_unlimited'),
                          see_who_liked: t('benefit_see_likes'),
                          worldwide_access: t('benefit_worldwide'),
                          location_change: t('benefit_location'),
                          reset_discovery: t('benefit_reset')
                        };
                        label = labels[key] || key;
                      } else if (key === 'visibility_boost') {
                        label = `${value}x ${t('benefit_visibility')}`;
                      }

                      return (
                        <div key={key} className="flex items-start gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                          <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                          <span>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  {activeBoosts.some(b => b.itemId === item.id) ? (
                    <div className="w-full bg-green-500/10 border border-green-500/20 rounded-xl py-4 flex flex-col items-center justify-center gap-1 group">
                      <div className="flex items-center gap-2 text-green-600 font-black text-sm">
                        <Zap size={16} fill="currentColor" className="animate-pulse" />
                        ATIVO
                      </div>
                      <span className="text-[10px] text-green-600/70 font-bold uppercase">Recurso habilitado</span>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handlePurchase(item.id)}
                      disabled={purchasingId === item.id}
                      className="w-full font-black text-sm py-6 rounded-xl transition-all active:scale-95 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none shadow-lg shadow-indigo-200/50 hover:brightness-110"
                    >
                      {purchasingId === item.id ? (
                        <Loading size="sm" />
                      ) : (
                        <div className="flex items-center justify-between w-full px-2">
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: item.currency || 'BRL' }).format(item.price)}</span>
                          <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            {t('buy_now')}
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 outline-none">
          {purchases.length > 0 ? (
            <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-neutral-900">
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/10 text-muted-foreground font-bold">
                        <th className="px-6 py-4 text-left">{t('item')}</th>
                        <th className="px-6 py-4 text-left">{t('date')}</th>
                        <th className="px-6 py-4 text-left">{t('amount')}</th>
                        <th className="px-6 py-4 text-left">{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {purchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-muted/5 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <Zap size={16} fill="currentColor" />
                              </div>
                              <div>
                                <div className="font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                  {purchase.item?.name}
                                </div>
                                {purchase.item?.description && (
                                  <div className="text-[10px] text-muted-foreground line-clamp-1">{purchase.item.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground font-medium">
                            {new Date(purchase.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 font-black text-indigo-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: purchase.currency || 'BRL' }).format(purchase.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge 
                              variant={purchase.status === "COMPLETED" ? "default" : "outline"}
                              className={cn(
                                "text-[10px] px-3 py-1 font-black uppercase tracking-tighter",
                                purchase.status === "COMPLETED" ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : ""
                              )}
                            >
                              {t(`status_${purchase.status}` as any)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Zap size={18} fill="currentColor" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-neutral-900 dark:text-white">
                              {purchase.item?.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(purchase.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-indigo-600 text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: purchase.currency || 'BRL' }).format(purchase.amount)}
                          </div>
                          <Badge 
                            variant={purchase.status === "COMPLETED" ? "default" : "outline"}
                            className={cn(
                              "text-[9px] px-2 py-0.5 mt-1 font-black uppercase tracking-tighter",
                              purchase.status === "COMPLETED" ? "bg-green-100 text-green-700 border-green-200" : ""
                            )}
                          >
                            {t(`status_${purchase.status}` as any)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 bg-muted/10">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="p-8 bg-muted/20 rounded-full animate-pulse">
                  <ShoppingBag size={64} className="text-muted-foreground/30" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <p className="font-black text-2xl text-neutral-900 dark:text-white">{t('no_purchases')}</p>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    Você ainda não possui itens adquiridos. Explore nossa loja e turbine seu perfil com recursos exclusivos!
                  </p>
                </div>
                <Button 
                  onClick={() => setActiveTab("store")}
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 rounded-full"
                >
                  Ir para a Loja
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </RadixTabs>
    </div>
  );
}
