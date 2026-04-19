// Conteúdo padrão da landing page (usado quando CMS não tem dados)

export const defaultContent = {
  hero: {
    title: 'Encontre quem combina com você',
    subtitle: 'Ever • Now',
    description: 'Relacionamento sério ou encontro imediato. Você decide. Compatibilidade profunda, privacidade real.',
    ctaPrimary: 'Comece agora',
    ctaSecondary: 'Já tenho conta'
  },
  valueProposition: {
    title: 'Por que EverNOW?',
    subtitle: 'Uma nova forma de encontrar conexões verdadeiras',
    items: [
      {
        icon: 'Heart',
        title: 'Compatibilidade Real',
        description: 'Algoritmo inteligente que analisa preferências, valores e estilo de vida para sugerir conexões realmente compatíveis.'
      },
      {
        icon: 'Shield',
        title: 'Privacidade Forte',
        description: 'Sem feed público, sem exposição desnecessária. Você controla quem vê seu perfil.'
      },
      {
        icon: 'Users',
        title: 'Encontros Reais',
        description: 'Plataforma focada em gerar conexões verdadeiras, não apenas likes superficiais.'
      },
      {
        icon: 'Zap',
        title: 'Resultados Rápidos',
        description: 'Algoritmo otimizado para apresentar pessoas compatíveis desde o primeiro dia.'
      }
    ]
  },
  everNow: {
    title: 'Ever + Now',
    subtitle: 'Dois modos, uma plataforma',
    ever: {
      title: 'Ever',
      tagline: 'Para relacionamentos sérios',
      description: 'Encontre alguém para construir algo duradouro. Compatibilidade profunda, valores alinhados, conexões que fazem sentido.',
      features: ['Compatibilidade detalhada', 'Análise de valores', 'Perfis completos', 'Conversas profundas']
    },
    now: {
      title: 'Now',
      tagline: 'Para encontros imediatos',
      description: 'Quer conhecer alguém hoje? O modo Now conecta pessoas que estão disponíveis agora, na sua região.',
      features: ['Geolocalizacão precisa', 'Disponibilidade em tempo real', 'Conexões instantâneas', 'Encontros rápidos']
    }
  },
  compatibility: {
    title: 'Compatibilidade Profunda',
    subtitle: 'Além das aparências',
    description: 'Nosso algoritmo analisa mais de 100 variáveis de personalidade, estilo de vida e valores para calcular compatibilidade real.',
    categories: [
      { name: 'Personalidade', description: 'Extroversão, abertura, estabilidade emocional' },
      { name: 'Estilo de Vida', description: 'Rotina, hábitos, hobbies e interesses' },
      { name: 'Valores', description: 'Família, carreira, religião, política' },
      { name: 'Relacionamento', description: 'Comunicação, afeto, comprometimento' }
    ]
  },
  filters: {
    title: 'Filtros Avançados',
    subtitle: 'Encontre exatamente quem você procura',
    description: 'Filtros precisos para encontrar pessoas que realmente combinam com o que você busca.',
    items: [
      'Distância e localização',
      'Idade e compatível',
      'Interesses específicos',
      'Estilo de relacionamento',
      'Hábitos e rotina',
      'Preferências pessoais'
    ]
  },
  realMeetings: {
    title: 'Encontros Reais',
    subtitle: 'Do virtual para o presencial',
    description: 'EverNOW foi criado para gerar encontros reais, não apenas likes vazios.',
    stats: [
      { value: '87%', label: 'das conexões resultam em conversa' },
      { value: '64%', label: 'das conversas levam a encontro' },
      { value: '4.8', label: 'avaliação média dos usuários' }
    ]
  },
  privacy: {
    title: 'Privacidade Levá a Sério',
    subtitle: 'Seus dados, seu controle',
    description: 'Não vendemos seus dados. Não expomos seu perfil. Você decide quem vê o quê.',
    features: [
      { title: 'Modo Discreto', description: 'Navegue sem ser visto' },
      { title: 'Controle de Visibilidade', description: 'Escolha quem pode ver seu perfil' },
      { title: 'Dados Criptografados', description: 'Suas conversas são protegidas' },
      { title: 'Sem Anuncios', description: 'Não usamos seus dados para anúncios' }
    ]
  },
  passport: {
    title: 'Viagem EverNOW',
    subtitle: 'Conecte-se com pessoas do mundo todo',
    description: 'Viajando ou planejando uma viagem? A Viagem pelo mundo permite que você explore conexões em qualquer cidade do mundo.',
    features: ['Explore qualquer cidade', 'Planeje encontros em viagens', 'Conheça pessoas antes de chegar', 'Múltiplas localizações']
  },
  scheduledPassport: {
    title: 'Viagem Programada',
    subtitle: 'Planeje suas conexões',
    description: 'Viagem marcada? Agende sua viagem para ativar automaticamente quando você chegar no destino.',
    howItWorks: [
      { step: '1', title: 'Escolha o destino', description: 'Selecione a cidade para onde você vai' },
      { step: '2', title: 'Defina as datas', description: 'Configure quando quer começar a aparecer lá' },
      { step: '3', title: 'Relaxe', description: 'A viagem ativa automaticamente' }
    ]
  },
  premiumBenefits: {
    title: 'Vantagens Premium',
    subtitle: 'Maximize suas chances',
    items: [
      { icon: 'Crown', title: 'Likes Ilimitados', description: 'Sem limites para curtir perfis' },
      { icon: 'Eye', title: 'Veja quem curtiu', description: 'Descubra quem se interessou por você' },
      { icon: 'Sparkles', title: 'Sinais Fortes', description: 'Destaque-se para quem te interessa' },
      { icon: 'Zap', title: 'Impulso de Perfil', description: 'Apareça para mais pessoas' },
      { icon: 'MapPin', title: 'Viagem', description: 'Conecte-se em qualquer lugar do mundo' },
      { icon: 'Filter', title: 'Filtros Avançados', description: 'Encontre exatamente quem procura' }
    ]
  },
  finalCta: {
    title: 'Pronto para encontrar alguém especial?',
    subtitle: 'Cadastre-se gratuitamente e comece sua jornada.',
    button: 'Criar conta gratuita'
  }
};

export const defaultFaqs = [
  {
    question: 'O EverNOW é gratuito?',
    answer: 'Sim! O EverNOW oferece um plano gratuito com funcionalidades essenciais. Para recursos avançados como Viagem e filtros especiais, oferecemos planos premium.'
  },
  {
    question: 'Qual a diferença entre Ever e Now?',
    answer: 'Ever é para quem busca relacionamentos sérios, com algoritmo de compatibilidade profunda. Now é para encontros imediatos, conectando pessoas disponíveis agora na sua região.'
  },
  {
    question: 'Como funciona a compatibilidade?',
    answer: 'Nosso algoritmo analisa mais de 100 variáveis incluindo personalidade, valores, estilo de vida e preferências para calcular uma porcentagem de compatibilidade real.'
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Absolutamente. Não vendemos dados, suas conversas são criptografadas, e você tem controle total sobre a visibilidade do seu perfil.'
  },
  {
    question: 'Posso cancelar minha assinatura?',
    answer: 'Sim, você pode cancelar a qualquer momento. O acesso premium continua até o fim do período pago.'
  },
  {
    question: 'O que é a Viagem?',
    answer: 'A Viagem permite que você explore conexões em qualquer cidade do mundo, ideal para viagens ou conhecer pessoas de outras regiões.'
  }
];

export const defaultTestimonials = [
  {
    name: 'Mariana',
    age: 28,
    city: 'São Paulo',
    content: 'Encontrei meu namorado no EverNOW. O que me conquistou foi a qualidade dos perfis e a compatibilidade real. Não é só sobre aparência.',
    rating: 5
  },
  {
    name: 'Rafael',
    age: 32,
    city: 'Rio de Janeiro',
    content: 'Já usei vários apps, mas o EverNOW é diferente. A privacidade é real e as conexões fazem mais sentido. Recomendo demais.',
    rating: 5
  },
  {
    name: 'Julia',
    age: 26,
    city: 'Belo Horizonte',
    content: 'O modo Now é incrível! Conheci pessoas legais rapidamente quando estava viajando. A experiência é muito superior.',
    rating: 5
  },
  {
    name: 'Lucas',
    age: 30,
    city: 'Curitiba',
    content: 'Finalmente um app que entende que compatibilidade vai além de fotos. As conversas são melhores porque já sei que temos coisas em comum.',
    rating: 5
  }
];
