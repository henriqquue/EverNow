// Motor de Compatibilidade EverNOW

import { DEFAULT_COMPATIBILITY_WEIGHTS, IMPORTANCE_LEVELS, type CategorySlug } from './profile-data';

export interface UserProfileData {
  userId: string;
  answers: Record<string, string[]>; // categorySlug -> valores selecionados
  preferences: Record<string, { values: string[]; importance: string }>; // categorySlug -> preferências
}

export interface CategoryScore {
  category: string;
  categoryName: string;
  score: number;
  maxScore: number;
  percentage: number;
  explanation: string;
}

export interface CompatibilityResult {
  overallScore: number;
  overallPercentage: number;
  categoryScores: CategoryScore[];
  explanations: string[];
  highlights: string[];
}

// Pesos de importância para cálculo
const IMPORTANCE_MULTIPLIERS: Record<string, number> = {
  INDIFFERENT: 0.2,
  PREFERENCE: 0.5,
  VERY_IMPORTANT: 0.8,
  ESSENTIAL: 1.0,
};

// Nomes das categorias em PT-BR
const CATEGORY_NAMES: Record<string, string> = {
  basico: 'Básico',
  intencao: 'Intenção',
  aparencia: 'Aparência',
  familia: 'Família',
  religiao: 'Religião',
  'estilo-vida': 'Estilo de Vida',
  habitos: 'Hábitos',
  cultura: 'Cultura',
  pets: 'Pets',
  profissao: 'Profissão',
  encontro: 'Encontro',
};

/**
 * Calcula a compatibilidade entre dois usuários
 */
export function calculateCompatibility(
  userA: UserProfileData,
  userB: UserProfileData,
  customWeights?: Record<string, { weight: number; boostMatch: number; penalty: number }>
): CompatibilityResult {
  const weights = customWeights || DEFAULT_COMPATIBILITY_WEIGHTS;
  const categoryScores: CategoryScore[] = [];
  const explanations: string[] = [];
  const highlights: string[] = [];

  let totalWeightedScore = 0;
  let totalWeight = 0;

  // Iterar por cada categoria
  for (const [category, categoryWeight] of Object.entries(weights)) {
    const categorySlug = category as CategorySlug;
    
    // Obter respostas e preferências de ambos
    const aAnswers = userA.answers[categorySlug] || [];
    const aPrefs = userA.preferences[categorySlug];
    const bAnswers = userB.answers[categorySlug] || [];
    const bPrefs = userB.preferences[categorySlug];

    // Se nenhum dos dois preencheu, pular
    if (aAnswers.length === 0 && bAnswers.length === 0) {
      continue;
    }

    // Calcular score da categoria
    const { score, maxScore, explanation } = calculateCategoryScore(
      aAnswers,
      aPrefs,
      bAnswers,
      bPrefs,
      categoryWeight
    );

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    categoryScores.push({
      category: categorySlug,
      categoryName: CATEGORY_NAMES[categorySlug] || categorySlug,
      score,
      maxScore,
      percentage,
      explanation,
    });

    // Adicionar ao total ponderado
    totalWeightedScore += score * categoryWeight.weight;
    totalWeight += maxScore * categoryWeight.weight;

    // Gerar destaques
    if (percentage >= 80) {
      highlights.push(`Alta compatibilidade em ${CATEGORY_NAMES[categorySlug]}`);
    }
    if (explanation) {
      explanations.push(explanation);
    }
  }

  // Calcular score geral
  const overallScore = totalWeight > 0 ? totalWeightedScore : 0;
  const overallPercentage = totalWeight > 0 
    ? Math.round((totalWeightedScore / totalWeight) * 100) 
    : 0;

  return {
    overallScore,
    overallPercentage,
    categoryScores,
    explanations: explanations.slice(0, 5), // Limitar a 5 explicações
    highlights: highlights.slice(0, 3), // Limitar a 3 destaques
  };
}

/**
 * Calcula o score de uma categoria específica
 */
function calculateCategoryScore(
  aAnswers: string[],
  aPrefs: { values: string[]; importance: string } | undefined,
  bAnswers: string[],
  bPrefs: { values: string[]; importance: string } | undefined,
  weights: { weight: number; boostMatch: number; penalty: number }
): { score: number; maxScore: number; explanation: string } {
  let score = 0;
  let maxScore = 100; // Score máximo base
  let explanation = '';

  // Se ambos preencheram respostas, calcular match direto
  if (aAnswers.length > 0 && bAnswers.length > 0) {
    const intersection = aAnswers.filter(a => bAnswers.includes(a));
    const union = [...new Set([...aAnswers, ...bAnswers])];
    
    // Índice de Jaccard para similaridade
    const similarity = union.length > 0 ? intersection.length / union.length : 0;
    score = similarity * 50; // Base de 50 pontos para match direto
    
    if (similarity > 0.5) {
      explanation = `Vocês têm ${intersection.length} característica(s) em comum`;
    }
  }

  // Verificar se A corresponde às preferências de B
  if (bPrefs && bPrefs.values.length > 0) {
    const bImportance = IMPORTANCE_MULTIPLIERS[bPrefs.importance] || 0.5;
    const matchesB = aAnswers.filter(a => bPrefs.values.includes(a));
    const matchRatioB = bPrefs.values.length > 0 
      ? matchesB.length / bPrefs.values.length 
      : 0;
    
    // Adicionar pontos baseado no match com preferências de B
    score += matchRatioB * 25 * bImportance;
    
    // Bônus para match perfeito
    if (matchRatioB === 1) {
      score += weights.boostMatch * 10;
    }
    
    // Penalidade se preferência essencial não for atendida
    if (bPrefs.importance === 'ESSENTIAL' && matchRatioB === 0) {
      score -= weights.penalty * 20;
    }
  }

  // Verificar se B corresponde às preferências de A
  if (aPrefs && aPrefs.values.length > 0) {
    const aImportance = IMPORTANCE_MULTIPLIERS[aPrefs.importance] || 0.5;
    const matchesA = bAnswers.filter(b => aPrefs.values.includes(b));
    const matchRatioA = aPrefs.values.length > 0 
      ? matchesA.length / aPrefs.values.length 
      : 0;
    
    // Adicionar pontos baseado no match com preferências de A
    score += matchRatioA * 25 * aImportance;
    
    // Bônus para match perfeito
    if (matchRatioA === 1) {
      score += weights.boostMatch * 10;
    }
    
    // Penalidade se preferência essencial não for atendida
    if (aPrefs.importance === 'ESSENTIAL' && matchRatioA === 0) {
      score -= weights.penalty * 20;
    }
  }

  // Garantir score dentro dos limites
  score = Math.max(0, Math.min(score, maxScore));

  return { score, maxScore, explanation };
}

/**
 * Gera uma justificativa amigável para a compatibilidade
 */
export function generateCompatibilityExplanation(
  result: CompatibilityResult
): string {
  const { overallPercentage, categoryScores, highlights } = result;

  if (overallPercentage >= 85) {
    return `Vocês têm uma compatibilidade excepcional! ${highlights[0] || ''}`;
  }
  
  if (overallPercentage >= 70) {
    return `Ótima compatibilidade! ${highlights[0] || 'Muitos pontos em comum.'}`;
  }
  
  if (overallPercentage >= 50) {
    const topCategory = categoryScores.sort((a, b) => b.percentage - a.percentage)[0];
    return `Boa compatibilidade, especialmente em ${topCategory?.categoryName || 'alguns aspectos'}.`;
  }
  
  if (overallPercentage >= 30) {
    return 'Algumas semelhanças podem render boas conversas.';
  }
  
  return 'Perfis diferentes podem trazer novas perspectivas!';
}

/**
 * Calcula o score de preenchimento do perfil (0-100)
 */
export function calculateProfileCompleteness(
  answers: Record<string, string[]>,
  requiredCategories: string[] = ['basico', 'intencao']
): { percentage: number; missingCategories: string[]; suggestions: string[] } {
  const allCategories = Object.keys(CATEGORY_NAMES);
  const filledCategories = Object.keys(answers).filter(cat => 
    answers[cat] && answers[cat].length > 0
  );

  // Verificar categorias obrigatórias
  const missingRequired = requiredCategories.filter(
    cat => !filledCategories.includes(cat)
  );

  // Calcular porcentagem
  // Categorias obrigatórias valem 60%, opcionais valem 40%
  const requiredWeight = 60;
  const optionalWeight = 40;
  
  const requiredFilled = requiredCategories.filter(
    cat => filledCategories.includes(cat)
  ).length;
  const requiredScore = requiredCategories.length > 0 
    ? (requiredFilled / requiredCategories.length) * requiredWeight 
    : requiredWeight;

  const optionalCategories = allCategories.filter(
    cat => !requiredCategories.includes(cat)
  );
  const optionalFilled = optionalCategories.filter(
    cat => filledCategories.includes(cat)
  ).length;
  const optionalScore = optionalCategories.length > 0 
    ? (optionalFilled / optionalCategories.length) * optionalWeight 
    : optionalWeight;

  const percentage = Math.round(requiredScore + optionalScore);

  // Gerar sugestões
  const suggestions: string[] = [];
  const missingCategories: string[] = [];

  for (const cat of allCategories) {
    if (!filledCategories.includes(cat)) {
      missingCategories.push(cat);
      if (suggestions.length < 3) {
        suggestions.push(
          `Preencha "${CATEGORY_NAMES[cat]}" para melhorar suas recomendações`
        );
      }
    }
  }

  return {
    percentage,
    missingCategories,
    suggestions,
  };
}

/**
 * Ordena usuários por compatibilidade
 */
export function sortUsersByCompatibility(
  currentUser: UserProfileData,
  users: UserProfileData[],
  customWeights?: Record<string, { weight: number; boostMatch: number; penalty: number }>
): Array<{ user: UserProfileData; compatibility: CompatibilityResult }> {
  return users
    .map(user => ({
      user,
      compatibility: calculateCompatibility(currentUser, user, customWeights),
    }))
    .sort((a, b) => b.compatibility.overallPercentage - a.compatibility.overallPercentage);
}
