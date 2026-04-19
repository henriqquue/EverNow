'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { 
  Sliders, 
  Save, 
  RotateCcw, 
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { DEFAULT_COMPATIBILITY_WEIGHTS, PROFILE_CATEGORIES } from '@/lib/profile-data';

interface Weight {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  weight: number;
  boostMatch: number;
  penalty: number;
  hasCustomWeight: boolean;
}

export default function CompatibilidadePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [originalWeights, setOriginalWeights] = useState<Weight[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadWeights();
  }, []);

  useEffect(() => {
    // Verificar se houve mudanças
    const changed = JSON.stringify(weights) !== JSON.stringify(originalWeights);
    setHasChanges(changed);
  }, [weights, originalWeights]);

  const loadWeights = async () => {
    try {
      const res = await fetch('/api/superadmin/compatibility-weights');
      if (res.ok) {
        const { weights: data } = await res.json();
        setWeights(data);
        setOriginalWeights(data);
      }
    } catch (error) {
      console.error('Erro ao carregar pesos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (categoryId: string, field: 'weight' | 'boostMatch' | 'penalty', value: number) => {
    setWeights((prev) =>
      prev.map((w) =>
        w.categoryId === categoryId ? { ...w, [field]: value } : w
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/superadmin/compatibility-weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights }),
      });

      if (res.ok) {
        setOriginalWeights(weights);
        setMessage({ type: 'success', text: 'Pesos atualizados com sucesso! O cache de compatibilidade foi limpo.' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao salvar pesos.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar pesos.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Resetar para valores padrão
    setWeights((prev) =>
      prev.map((w) => {
        const defaultWeight = DEFAULT_COMPATIBILITY_WEIGHTS[w.categorySlug as keyof typeof DEFAULT_COMPATIBILITY_WEIGHTS];
        return {
          ...w,
          weight: defaultWeight?.weight ?? 1.0,
          boostMatch: defaultWeight?.boostMatch ?? 0.1,
          penalty: defaultWeight?.penalty ?? 0.1,
        };
      })
    );
  };

  const getWeightLabel = (value: number) => {
    if (value >= 1.5) return { label: 'Muito alto', color: 'text-green-500' };
    if (value >= 1.0) return { label: 'Alto', color: 'text-blue-500' };
    if (value >= 0.5) return { label: 'Médio', color: 'text-yellow-500' };
    return { label: 'Baixo', color: 'text-gray-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Algoritmo de Compatibilidade</h1>
          <p className="text-muted-foreground">
            Configure os pesos das categorias no cálculo de compatibilidade
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar padrões
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving} loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            Salvar alterações
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Como funciona o algoritmo</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Peso:</strong> Importância da categoria no cálculo geral (0.1 a 2.0)</li>
                <li>• <strong>Bônus de Match:</strong> Pontos extras quando há compatibilidade perfeita</li>
                <li>• <strong>Penalidade:</strong> Redução quando preferências essenciais não são atendidas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weights Grid */}
      <div className="grid gap-4">
        {weights.map((w) => {
          const weightInfo = getWeightLabel(w.weight);
          
          return (
            <motion.div
              key={w.categoryId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Category Info */}
                    <div className="lg:w-48">
                      <h3 className="font-medium">{w.categoryName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={weightInfo.color}>
                          {weightInfo.label}
                        </Badge>
                        {w.hasCustomWeight && (
                          <Badge variant="secondary">Customizado</Badge>
                        )}
                      </div>
                    </div>

                    {/* Sliders */}
                    <div className="flex-1 grid sm:grid-cols-3 gap-6">
                      {/* Weight */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium flex items-center gap-1">
                            <Sliders className="w-3 h-3" />
                            Peso
                          </label>
                          <span className="text-sm text-muted-foreground">{w.weight.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="2.0"
                          step="0.1"
                          value={w.weight}
                          onChange={(e) => handleWeightChange(w.categoryId, 'weight', parseFloat(e.target.value))}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      {/* Boost */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            Bônus
                          </label>
                          <span className="text-sm text-muted-foreground">{w.boostMatch.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="0.5"
                          step="0.05"
                          value={w.boostMatch}
                          onChange={(e) => handleWeightChange(w.categoryId, 'boostMatch', parseFloat(e.target.value))}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                      </div>

                      {/* Penalty */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-red-500" />
                            Penalidade
                          </label>
                          <span className="text-sm text-muted-foreground">{w.penalty.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="0.5"
                          step="0.05"
                          value={w.penalty}
                          onChange={(e) => handleWeightChange(w.categoryId, 'penalty', parseFloat(e.target.value))}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-center gap-4"
        >
          <AlertCircle className="w-5 h-5" />
          <span>Você tem alterações não salvas</span>
          <Button variant="secondary" size="sm" onClick={handleSave} loading={saving}>
            Salvar
          </Button>
        </motion.div>
      )}
    </div>
  );
}
