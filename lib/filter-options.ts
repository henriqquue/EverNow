// Filter options for the discovery system

export const FILTER_CATEGORIES = {
  basic: {
    name: 'Básicos',
    icon: 'User',
    filters: ['age', 'distance', 'gender', 'orientation']
  },
  intention: {
    name: 'Intenção',
    icon: 'Heart',
    filters: ['intention']
  },
  appearance: {
    name: 'Aparência',
    icon: 'Eye',
    filters: ['bodyType', 'height', 'beard', 'hair', 'tattoo']
  },
  family: {
    name: 'Família',
    icon: 'Baby',
    filters: ['hasChildren', 'wantsChildren']
  },
  religion: {
    name: 'Religião',
    icon: 'Church',
    filters: ['religion', 'denomination']
  },
  lifestyle: {
    name: 'Estilo de Vida',
    icon: 'Sparkles',
    filters: ['lifestyle', 'education', 'profession']
  },
  habits: {
    name: 'Hábitos',
    icon: 'Coffee',
    filters: ['smoking', 'drinking', 'exercise']
  },
  culture: {
    name: 'Cultura',
    icon: 'Music',
    filters: ['music', 'movies', 'series', 'entertainment']
  },
  pets: {
    name: 'Pets',
    icon: 'Dog',
    filters: ['pets']
  },
  meeting: {
    name: 'Encontro',
    icon: 'Calendar',
    filters: ['meetingType']
  },
  location: {
    name: 'Localização',
    icon: 'MapPin',
    filters: ['neighborhoods', 'states', 'cities', 'countries']
  },
  advanced: {
    name: 'Avançados',
    icon: 'Settings',
    filters: ['compatibility', 'verified', 'online', 'premium', 'passport']
  }
};

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Homem' },
  { value: 'FEMALE', label: 'Mulher' },
  { value: 'NON_BINARY', label: 'Não-binário' },
  { value: 'TRANS_MALE', label: 'Homem Trans' },
  { value: 'TRANS_FEMALE', label: 'Mulher Trans' },
  { value: 'GENDER_FLUID', label: 'Gênero Fluido' },
  { value: 'AGENDER', label: 'Agênero' },
  { value: 'OTHER', label: 'Outro' }
];

export const ORIENTATION_OPTIONS = [
  { value: 'heterosexual', label: 'Heterossexual' },
  { value: 'homosexual', label: 'Homossexual' },
  { value: 'bisexual', label: 'Bissexual' },
  { value: 'pansexual', label: 'Pansexual' },
  { value: 'asexual', label: 'Assexual' },
  { value: 'other', label: 'Outro' }
];

export const INTENTION_OPTIONS = [
  { value: 'SERIOUS', label: 'Relacionamento sério' },
  { value: 'CASUAL', label: 'Algo casual' },
  { value: 'FRIENDSHIP', label: 'Amizade' },
  { value: 'OPEN', label: 'Aberto a possibilidades' }
];

export const RELATIONSHIP_STATUS_OPTIONS = [
  { value: 'SINGLE', label: 'Solteiro(a)' },
  { value: 'DATING', label: 'Em um relacionamento' },
  { value: 'MARRIED', label: 'Casado(a)' },
  { value: 'DIVORCED', label: 'Divorciado(a)' },
  { value: 'WIDOWED', label: 'Viúvo(a)' },
  { value: 'SEPARATED', label: 'Separado(a)' },
  { value: 'OPEN_RELATIONSHIP', label: 'Relacionamento Aberto' }
];

export const BODY_TYPE_OPTIONS = [
  { value: 'slim', label: 'Magro' },
  { value: 'athletic', label: 'Atlético' },
  { value: 'average', label: 'Mediano' },
  { value: 'curvy', label: 'Curvilíneo' },
  { value: 'plus', label: 'Plus size' }
];

export const CHILDREN_OPTIONS = [
  { value: 'YES', label: 'Sim' },
  { value: 'NO', label: 'Não' },
  { value: 'DONT_MATTER', label: 'Tanto faz' }
];

export const RELIGION_OPTIONS = [
  { value: 'christian', label: 'Cristão' },
  { value: 'catholic', label: 'Católico' },
  { value: 'evangelical', label: 'Evangélico' },
  { value: 'spiritist', label: 'Espírita' },
  { value: 'jewish', label: 'Judeu' },
  { value: 'buddhist', label: 'Budista' },
  { value: 'muslim', label: 'Muçulmano' },
  { value: 'atheist', label: 'Ateu' },
  { value: 'agnostic', label: 'Agnóstico' },
  { value: 'other', label: 'Outro' },
  { value: 'none', label: 'Nenhuma' }
];

export const LIFESTYLE_OPTIONS = [
  { value: 'homebody', label: 'Caseiro' },
  { value: 'social', label: 'Social' },
  { value: 'adventurous', label: 'Aventureiro' },
  { value: 'balanced', label: 'Equilibrado' },
  { value: 'workaholic', label: 'Workaholic' }
];

export const HABIT_OPTIONS = {
  smoking: [
    { value: 'never', label: 'Não fumo' },
    { value: 'social', label: 'Socialmente' },
    { value: 'regular', label: 'Regularmente' }
  ],
  drinking: [
    { value: 'never', label: 'Não bebo' },
    { value: 'social', label: 'Socialmente' },
    { value: 'regular', label: 'Regularmente' }
  ],
  exercise: [
    { value: 'never', label: 'Não pratico' },
    { value: 'sometimes', label: 'Às vezes' },
    { value: 'regular', label: 'Regularmente' },
    { value: 'daily', label: 'Diariamente' }
  ]
};

export const PET_OPTIONS = [
  { value: 'dog', label: 'Cachorro' },
  { value: 'cat', label: 'Gato' },
  { value: 'bird', label: 'Pássaro' },
  { value: 'fish', label: 'Peixe' },
  { value: 'other', label: 'Outro' },
  { value: 'none', label: 'Nenhum' }
];

export const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'Ensino médio' },
  { value: 'college', label: 'Ensino superior' },
  { value: 'postgrad', label: 'Pós-graduação' },
  { value: 'master', label: 'Mestrado' },
  { value: 'phd', label: 'Doutorado' }
];

export const MEETING_TYPE_OPTIONS = [
  { value: 'coffee', label: 'Café' },
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'bar', label: 'Bar' },
  { value: 'cinema', label: 'Cinema' },
  { value: 'walk', label: 'Caminhada' },
  { value: 'outdoor', label: 'Ao ar livre' }
];

export const MEETING_ACTIVITY_OPTIONS = [
  { value: 'COFFEE', label: 'Café', icon: 'Coffee', color: 'bg-amber-500' },
  { value: 'RESTAURANT', label: 'Restaurante', icon: 'UtensilsCrossed', color: 'bg-red-500' },
  { value: 'BAR', label: 'Bar', icon: 'Wine', color: 'bg-purple-500' },
  { value: 'CINEMA', label: 'Cinema', icon: 'Clapperboard', color: 'bg-blue-500' },
  { value: 'WALK', label: 'Caminhada', icon: 'Footprints', color: 'bg-green-500' },
  { value: 'GYM', label: 'Academia', icon: 'Dumbbell', color: 'bg-orange-500' },
  { value: 'OUTDOOR', label: 'Ao ar livre', icon: 'TreePine', color: 'bg-emerald-500' }
];

export const REPORT_REASON_OPTIONS = [
  { value: 'FAKE_PROFILE', label: 'Perfil falso' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Conteúdo inapropriado' },
  { value: 'HARASSMENT', label: 'Assédio' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'UNDERAGE', label: 'Menor de idade' },
  { value: 'SCAM', label: 'Golpe' },
  { value: 'OTHER', label: 'Outro' }
];

export const PASSPORT_START_MODE_OPTIONS = [
  { value: 'DURING_PERIOD', label: 'Durante o período' },
  { value: 'THREE_DAYS_BEFORE', label: '3 dias antes' },
  { value: 'SEVEN_DAYS_BEFORE', label: '7 dias antes' },
  { value: 'FOURTEEN_DAYS_BEFORE', label: '14 dias antes' },
  { value: 'CUSTOM', label: 'Personalizado' }
];

export const PASSPORT_VISIBILITY_OPTIONS = [
  { value: 'CITY_ONLY', label: 'Apenas cidade' },
  { value: 'CITY_AND_DATES', label: 'Cidade e datas' },
  { value: 'HIDDEN', label: 'Não informar' }
];
