# EverNOW — Documentação Completa do Desenvolvedor

> Guia técnico completo para instalação, configuração, desenvolvimento e deploy do EverNOW.

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Instalação e Setup Local](#4-instalação-e-setup-local)
5. [Variáveis de Ambiente](#5-variáveis-de-ambiente)
6. [Banco de Dados (Prisma + PostgreSQL)](#6-banco-de-dados-prisma--postgresql)
7. [Autenticação (NextAuth.js)](#7-autenticação-nextauthjs)
8. [Sistema de Rotas](#8-sistema-de-rotas)
9. [API Routes — Referência Completa](#9-api-routes--referência-completa)
10. [Módulos de Negócio (Lib)](#10-módulos-de-negócio-lib)
11. [Componentes](#11-componentes)
12. [Sistema de Planos e Entitlements](#12-sistema-de-planos-e-entitlements)
13. [Motor de Descoberta](#13-motor-de-descoberta)
14. [Motor de Compatibilidade](#14-motor-de-compatibilidade)
15. [Sistema de Governança de Perfil](#15-sistema-de-governança-de-perfil)
16. [Sistema Comercial](#16-sistema-comercial)
17. [Sistema de Ads](#17-sistema-de-ads)
18. [Middleware e Segurança](#18-middleware-e-segurança)
19. [Terminologia Oficial](#19-terminologia-oficial)
20. [Build e Deploy](#20-build-e-deploy)
21. [Seeds e Dados Iniciais](#21-seeds-e-dados-iniciais)
22. [Troubleshooting](#22-troubleshooting)

---

## 1. Visão Geral da Arquitetura

O EverNOW é uma aplicação **Next.js 14** (App Router) full-stack com:

- **Frontend**: React 18, Tailwind CSS, Framer Motion, Radix UI, shadcn/ui
- **Backend**: Next.js API Routes (Route Handlers)
- **Banco de Dados**: PostgreSQL via Prisma ORM
- **Autenticação**: NextAuth.js v4 com Credentials Provider
- **State Management**: React hooks, Context API, SWR

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│  Landing Page ← CMS/DB → App Router Pages   │
│  (React 18 + Tailwind + Framer Motion)      │
├─────────────────────────────────────────────┤
│              API Routes (Backend)            │
│  /api/auth  /api/discovery  /api/matches    │
│  /api/chat  /api/subscription  /api/admin   │
│  /api/superadmin  /api/paywall  /api/offers │
├─────────────────────────────────────────────┤
│           Business Logic (lib/)              │
│  discovery-engine  compatibility-engine      │
│  entitlement-service  subscription-service   │
│  profile-governance  commercial-events       │
├─────────────────────────────────────────────┤
│         Prisma ORM → PostgreSQL              │
│  63 models  35 enums  1965 linhas schema    │
└─────────────────────────────────────────────┘
```

---

## 2. Stack Tecnológica

| Categoria | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js | 14.2.28 |
| Runtime | React | 18.2.0 |
| Linguagem | TypeScript | 5.2.2 |
| CSS | Tailwind CSS | 3.3.3 |
| ORM | Prisma | 6.7.0 |
| Banco de Dados | PostgreSQL | 14+ |
| Autenticação | NextAuth.js | 4.24.11 |
| Animações | Framer Motion | 10.18.0 |
| UI Components | Radix UI + shadcn/ui | Vários |
| Icons | Lucide React | 0.446.0 |
| Forms | React Hook Form + Zod | 7.53 / 3.23 |
| State | SWR + Context | 2.2.4 |
| Package Manager | Yarn | — |

---

## 3. Estrutura de Diretórios

```
nextjs_space/
├── app/                          # App Router pages
│   ├── layout.tsx                # Root layout (metadata, providers)
│   ├── page.tsx                  # Landing page (SSR, CMS data)
│   ├── login/page.tsx            # Login
│   ├── cadastro/page.tsx         # Registro
│   ├── recuperar-senha/page.tsx  # Recuperação de senha
│   ├── planos/page.tsx           # Planos públicos
│   ├── checkout/page.tsx         # Checkout
│   ├── sucesso/page.tsx          # Pós-compra
│   ├── app/                      # Área autenticada (user)
│   │   ├── layout.tsx            # Layout autenticado + sidebar
│   │   ├── page.tsx              # Dashboard
│   │   ├── descobrir/page.tsx    # Descoberta de perfis
│   │   ├── matches/page.tsx      # Conexões
│   │   ├── conversas/page.tsx    # Lista de conversas
│   │   ├── chat/[threadId]/      # Chat individual
│   │   ├── passaporte/page.tsx   # Viagem
│   │   ├── sair-hoje/page.tsx    # Modo encontro
│   │   ├── perfil/page.tsx       # Meu perfil
│   │   ├── perfil/[userId]/      # Perfil de outro usuário
│   │   ├── configuracoes/        # Configurações
│   │   ├── assinatura/           # Minha assinatura + trocar
│   │   ├── planos/page.tsx       # Ver planos (logado)
│   │   └── onboarding/page.tsx   # Onboarding
│   ├── admin/                    # Painel Admin
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard admin
│   │   ├── usuarios/page.tsx     # Gestão de usuários
│   │   ├── moderacao/page.tsx    # Moderação
│   │   └── relatorios/page.tsx   # Relatórios
│   ├── superadmin/               # Painel SuperAdmin
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard SA
│   │   ├── planos/               # Gestão de planos
│   │   ├── modulos/              # Gestão de módulos
│   │   ├── funcionalidades/      # Gestão de features
│   │   ├── assinaturas/          # Gestão de assinaturas
│   │   ├── metricas/             # Métricas
│   │   ├── comercial/            # Dashboard comercial
│   │   ├── campanhas/            # Campanhas paywall
│   │   ├── banners/              # Banners
│   │   ├── cms/                  # CMS blocks
│   │   ├── landing/              # CMS Landing page
│   │   ├── anuncios/             # Sistema de ads
│   │   ├── cupons/               # Cupons de desconto
│   │   ├── compatibilidade/      # Pesos de compatibilidade
│   │   └── perfil-governanca/    # Governança de perfil
│   └── api/                      # API Route Handlers
│       ├── auth/[...nextauth]/   # NextAuth
│       ├── signup/               # Cadastro
│       ├── discovery/            # Descoberta
│       ├── likes/                # Curtidas
│       ├── matches/              # Conexões
│       ├── chat/                 # Chat
│       ├── passport/             # Viagem
│       ├── subscription/         # Assinatura
│       ├── plans/                # Planos
│       ├── profile/              # Perfil
│       ├── privacy/              # Privacidade
│       ├── features/             # Feature checks
│       ├── paywall/              # Paywall
│       ├── offers/               # Ofertas
│       ├── ads/                  # Ads
│       ├── verification/         # Verificação
│       ├── admin/                # APIs admin
│       └── superadmin/           # APIs superadmin
├── components/                   # Componentes React
│   ├── ui/                       # shadcn/ui base components (50+)
│   ├── discovery/                # Cards de perfil, filtros, modais
│   ├── landing/                  # Landing page sections
│   ├── commercial/               # Página de planos
│   ├── paywall/                  # Modal paywall, upgrade banner
│   ├── offers/                   # Banners e modais de ofertas
│   ├── onboarding/               # Steps do onboarding
│   ├── profile/                  # Badges e cards de perfil
│   ├── ads/                      # Slots de anúncios
│   └── providers.tsx             # SessionProvider + ThemeProvider
├── contexts/                     # React Contexts
│   ├── paywall-context.tsx       # Feature gating + paywall
│   └── offer-context.tsx         # Ofertas e campanhas
├── lib/                          # Business logic
│   ├── db.ts                     # Prisma client singleton
│   ├── auth-options.ts           # NextAuth config
│   ├── discovery-engine.ts       # Motor de descoberta (621 linhas)
│   ├── discovery.ts              # Queries de descoberta
│   ├── compatibility-engine.ts   # Motor de compatibilidade (313 linhas)
│   ├── entitlement-service.ts    # Verificação de permissões (672 linhas)
│   ├── subscription-service.ts   # Gestão de assinaturas (819 linhas)
│   ├── profile-governance.ts     # Governança de perfil (478 linhas)
│   ├── profile-data.ts           # Dados e categorias de perfil (473 linhas)
│   ├── commercial-events.ts      # Eventos comerciais
│   ├── ads.ts                    # Sistema de ads
│   ├── offers.ts                 # Sistema de ofertas
│   ├── coupons.ts                # Sistema de cupons
│   ├── analytics.ts              # Tracking de eventos
│   ├── filter-options.ts         # Opções de filtro
│   ├── landing-content.ts        # Conteúdo padrão da landing
│   ├── types.ts                  # Types compartilhados
│   └── utils.ts                  # Utilitários
├── hooks/                        # Custom hooks
│   └── use-toast.ts
├── prisma/
│   └── schema.prisma             # Schema do banco (1965 linhas, 63 models)
├── scripts/
│   ├── seed.ts                   # Seed principal
│   └── safe-seed.ts              # Seed seguro
├── middleware.ts                  # Auth middleware (route protection)
├── tailwind.config.ts             # Tailwind config
├── next.config.js                 # Next.js config
├── tsconfig.json
└── .env                           # Variáveis de ambiente
```

---

## 4. Instalação e Setup Local

### 4.1 Pré-requisitos

- **Node.js** 18+ (recomendado: 20 LTS)
- **Yarn** (package manager)
- **PostgreSQL** 14+ (local ou remoto)
- **Git**

### 4.2 Passos de Instalação

```bash
# 1. Clone ou copie o projeto
cd evernow/nextjs_space

# 2. Instale dependências
yarn install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações (veja seção 5)

# 4. Gere o Prisma Client
yarn prisma generate

# 5. Execute as migrations
yarn prisma db push

# 6. Execute o seed (dados iniciais)
yarn tsx scripts/seed.ts

# 7. Inicie o servidor de desenvolvimento
yarn dev

# O app estará disponível em http://localhost:3000
```

### 4.3 Criando o .env.example

Crie um arquivo `.env` na raiz do `nextjs_space/` com:

```env
# Banco de dados PostgreSQL
DATABASE_URL="postgresql://usuario:senha@localhost:5432/evernow?schema=public"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-aqui-gere-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 5. Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string do PostgreSQL |
| `NEXTAUTH_SECRET` | ✅ | Secret para JWT do NextAuth (gere com `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ⚠️ | URL base da aplicação (auto-configurado em produção na Abacus AI) |

---

## 6. Banco de Dados (Prisma + PostgreSQL)

### 6.1 Schema Overview

O schema possui **63 models** e **35 enums**. Principais domínios:

| Domínio | Models |
|---|---|
| **Autenticação** | User, Account, Session, VerificationToken |
| **Planos/Billing** | Plan, PlanInterval, PlanModule, Subscription, SubscriptionHistory |
| **Módulos/Features** | Module, Feature, FeatureLimit, FeatureUsage |
| **Perfil** | ProfileCategory, ProfileOption, UserProfileAnswer, UserPreference, UserPhoto, OnboardingProgress |
| **Governança** | ProfileFieldGovernance, UserFieldVisibility |
| **Compatibilidade** | CompatibilityWeight, CompatibilityCache |
| **Descoberta** | DiscoveryPreference, DiscoveryEvent, UserAffinity, SavedFilter |
| **Interações** | Like, Match, Favorite, Block, Report |
| **Chat** | ChatThread, ChatMessage |
| **Localização** | PassportSetting, ScheduledPassport, MeetingMode |
| **Comercial** | Campaign, CampaignEvent, Banner, PaywallEvent, Coupon, CouponRedemption, CommercialEvent |
| **CMS** | CmsBlock, LandingSection, LandingFAQ, LandingTestimonial, LandingSetting |
| **Ads** | AdZone, AdCampaign, AdCampaignZone, AdImpression, AdClick, AdGlobalSettings, PlanAdSettings, PlanAdZone |
| **Moderação** | VerificationRequest, ModerationAction |
| **Sistema** | Tenant, Notification, Setting, AnalyticsEvent |

### 6.2 Comandos Prisma

```bash
# Gerar client
yarn prisma generate

# Push schema para DB (dev)
yarn prisma db push

# Abrir Prisma Studio
yarn prisma studio

# Executar seed
yarn tsx scripts/seed.ts
```

### 6.3 Importante

- O Prisma Client singleton está em `lib/db.ts`
- **Nunca** use `yarn prisma db push --accept-data-loss` sem confirmação explícita
- O DB é compartilhado entre dev e produção (na Abacus AI) — cuidado com operações destrutivas
- Use `upsert` ao invés de `create` no seed para idempotência

---

## 7. Autenticação (NextAuth.js)

### 7.1 Configuração

Arquivo: `lib/auth-options.ts`

- **Provider**: Credentials (email + senha)
- **Adapter**: PrismaAdapter
- **Session Strategy**: JWT
- **Callbacks**: jwt (adiciona id, role, planId, planSlug, isPremium, subscriptionStatus) e session (expõe dados do token)

### 7.2 Roles

| Role | Acesso |
|---|---|
| `USER` | `/app/*` |
| `ADMIN` | `/app/*` + `/admin/*` |
| `SUPERADMIN` | `/app/*` + `/admin/*` + `/superadmin/*` |

### 7.3 Contas de Seed

| Email | Senha | Role |
|---|---|---|
| `superadmin@evernow.com` | `Super@123` | SUPERADMIN |
| `admin@evernow.com` | `Admin@123` | ADMIN |

---

## 8. Sistema de Rotas

### 8.1 Proteção de Rotas (middleware.ts)

O middleware protege rotas baseado em autenticação e role:

- **Rotas públicas**: `/`, `/login`, `/cadastro`, `/recuperar-senha`, `/planos`, `/checkout`, `/sucesso`, `/api/auth/*`, `/api/landing`, `/api/plans`, `/api/coupons/validate`
- **Rotas autenticadas**: `/app/*`
- **Rotas admin**: `/admin/*` → requer role ADMIN ou SUPERADMIN
- **Rotas superadmin**: `/superadmin/*` → requer role SUPERADMIN

---

## 9. API Routes — Referência Completa

### 9.1 Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/signup` | Cadastro de novo usuário |
| `*` | `/api/auth/[...nextauth]` | NextAuth handlers |

### 9.2 Perfil
| Método | Rota | Descrição |
|---|---|---|
| GET/PUT | `/api/profile/[userId]` | Perfil de usuário |
| GET/PUT | `/api/profile/answers` | Respostas do onboarding |
| GET | `/api/profile/categories` | Categorias de perfil |
| GET/PUT | `/api/profile/preferences` | Preferências |
| PUT | `/api/profile/onboarding` | Progresso do onboarding |
| PUT | `/api/profile/visibility` | Visibilidade de campos |
| GET | `/api/profile/governance` | Regras de governança |
| POST | `/api/profile-view` | Registrar visualização |

### 9.3 Descoberta
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/discovery` | Buscar perfis |
| GET/PUT | `/api/discovery/preferences` | Preferências de descoberta |
| POST | `/api/discovery/events` | Registrar eventos |
| GET/PUT | `/api/filters` | Filtros salvos |

### 9.4 Interações
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/likes` | Enviar curtida/sinal forte/dislike |
| GET/DELETE | `/api/matches` | Listar conexões / desfazer |
| GET/POST/DELETE | `/api/favorites` | Favoritos |
| POST | `/api/block` | Bloquear usuário |
| POST | `/api/report` | Denunciar usuário |

### 9.5 Chat
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/chat` | Listar threads |
| GET/POST | `/api/chat/[threadId]` | Mensagens de uma thread |
| PUT | `/api/chat/[threadId]/messages/[messageId]` | Editar mensagem |
| POST | `/api/chat/[threadId]/reactions` | Reagir a mensagem |

### 9.6 Viagem (Passaporte)
| Método | Rota | Descrição |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/passport` | Passaporte atual |
| GET/POST/PUT/DELETE | `/api/passport/scheduled` | Viagens programadas |

### 9.7 Modo Encontro
| Método | Rota | Descrição |
|---|---|---|
| GET/POST/PUT | `/api/meeting-mode` | Sair hoje |

### 9.8 Assinatura
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/subscription` | Assinatura atual |
| GET | `/api/subscription/summary` | Resumo |
| POST | `/api/subscription/upgrade` | Upgrade |
| POST | `/api/subscription/downgrade` | Downgrade |
| POST | `/api/subscription/cancel` | Cancelar |
| POST | `/api/subscription/reactivate` | Reativar |
| GET | `/api/subscription/history` | Histórico |

### 9.9 Planos e Comercial
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/plans` | Listar planos públicos |
| GET | `/api/plans/[slug]` | Detalhes de um plano |
| GET/POST | `/api/paywall` | Eventos de paywall |
| GET | `/api/offers` | Ofertas disponíveis |
| POST | `/api/coupons/validate` | Validar cupom |
| POST | `/api/coupons/redeem` | Resgatar cupom |
| POST | `/api/commercial-events` | Eventos comerciais |

### 9.10 Features e Entitlements
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/features/check` | Verificar acesso a feature |
| POST | `/api/features/usage` | Registrar uso de feature |

### 9.11 Privacidade
| Método | Rota | Descrição |
|---|---|---|
| GET/PUT | `/api/privacy` | Configurações de privacidade |
| PUT | `/api/notifications/preferences` | Preferências de notificação |

### 9.12 Verificação
| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/api/verification` | Solicitar verificação |

### 9.13 Ads
| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/api/ads` | Servir e registrar ads |

### 9.14 Landing
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/landing` | Dados da landing page |

### 9.15 Admin APIs
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/stats` | Estatísticas admin |
| GET/PUT | `/api/admin/users` | Gestão de usuários |
| GET/PUT | `/api/admin/reports` | Denúncias |
| GET | `/api/admin/reports/stats` | Métricas de relatórios |
| GET/PUT | `/api/admin/verification` | Verificações |
| GET | `/api/admin/moderation` | Histórico moderação |

### 9.16 SuperAdmin APIs
| Método | Rota | Descrição |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/superadmin/plans` | CRUD planos |
| `*` | `/api/superadmin/plans/[planId]/*` | Intervals, features, modules, duplicate |
| GET/POST/PUT/DELETE | `/api/superadmin/modules` | CRUD módulos |
| GET/POST/PUT/DELETE | `/api/superadmin/features` | CRUD features |
| GET | `/api/superadmin/subscriptions` | Listar assinaturas |
| GET | `/api/superadmin/metrics/dashboard` | Métricas dashboard |
| GET | `/api/superadmin/metrics/commercial` | Métricas comerciais |
| GET/POST/PUT/DELETE | `/api/superadmin/campaigns` | CRUD campanhas |
| GET/POST/PUT/DELETE | `/api/superadmin/banners` | CRUD banners |
| GET/POST/PUT/DELETE | `/api/superadmin/cms/blocks` | CRUD CMS blocks |
| GET/POST/PUT/DELETE | `/api/superadmin/cms/sections` | CMS sections |
| GET/POST/PUT/DELETE | `/api/superadmin/cms/faqs` | CMS FAQs |
| GET/POST/PUT/DELETE | `/api/superadmin/cms/testimonials` | CMS testimonials |
| GET/PUT | `/api/superadmin/cms/settings` | CMS settings |
| GET/PUT | `/api/superadmin/compatibility-weights` | Pesos compatibilidade |
| GET/POST/PUT/DELETE | `/api/superadmin/profile-governance` | Governança de perfil |
| GET/POST/PUT/DELETE | `/api/superadmin/coupons` | CRUD cupons |
| GET | `/api/superadmin/coupons/metrics` | Métricas cupons |
| `*` | `/api/superadmin/ads/*` | Zones, campaigns, metrics, settings |

---

## 10. Módulos de Negócio (Lib)

### 10.1 `lib/discovery-engine.ts` (621 linhas)
Motor principal de descoberta. Implementa:
- Scoring de perfis baseado em compatibilidade, afinidade e proximidade
- Filtragem por preferências, bloqueios e likes anteriores
- Suporte a modo premium (premium boost, discovery boost)
- Agregação de eventos de descoberta (likes, dislikes, superlikes)
- Cálculo de afinidade do usuário

### 10.2 `lib/compatibility-engine.ts` (313 linhas)
Motor de compatibilidade. Calcula:
- Score de compatibilidade entre dois usuários
- Análise por categoria (personalidade, valores, estilo de vida, etc.)
- Pesos configuráveis por categoria (via SuperAdmin)
- Cache de compatibilidade calculada

### 10.3 `lib/entitlement-service.ts` (672 linhas)
Serviço de verificação de permissões:
- `checkFeatureEntitlement(userId, featureSlug)` — verifica se o usuário tem acesso a uma feature
- `getModuleAccess(userId)` — lista módulos acessíveis
- `checkAndConsumeUsage(userId, featureSlug)` — verifica e consome uso
- Suporte a limit modes: HARD (bloqueia) e SOFT (avisa)
- Reset de uso por período (diário/semanal/mensal)

### 10.4 `lib/subscription-service.ts` (819 linhas)
Gestão completa de assinaturas:
- `upgradeSubscription()` — upgrade de plano
- `downgradeSubscription()` — downgrade
- `cancelSubscription()` — cancelamento
- `reactivateSubscription()` — reativação
- Histórico de ações de assinatura
- Eventos comerciais para tracking

### 10.5 `lib/profile-governance.ts` (478 linhas)
Sistema de governança de campos:
- Regras de visibilidade por campo
- Controle de quem pode ver cada informação
- Configuração via SuperAdmin
- Respeita nível de assinatura

### 10.6 `lib/profile-data.ts` (473 linhas)
Dados estruturados do perfil:
- Definição de categorias e opções do onboarding
- Pesos para cálculo de compatibilidade
- Estrutura de dados de perfil

### 10.7 Outros
- `lib/analytics.ts` — Tracking de eventos (match_created, like_sent, superlike_sent, etc.)
- `lib/commercial-events.ts` — Eventos comerciais (paywall, upgrade, etc.)
- `lib/offers.ts` — Sistema de ofertas contextuais
- `lib/coupons.ts` — Validação e resgate de cupons
- `lib/ads.ts` — Zonas de anúncio e configurações
- `lib/filter-options.ts` — Opções de filtro disponíveis
- `lib/landing-content.ts` — Conteúdo padrão da landing (fallback)
- `lib/utils.ts` — Utilitários (formatDate, formatCurrency, isValidEmail, checkPasswordStrength, etc.)

---

## 11. Componentes

### 11.1 Base UI (`components/ui/`)
50+ componentes shadcn/ui: Accordion, Alert, Avatar, Badge, Button, Card, Checkbox, Dialog, Dropdown, Input, Label, Modal, Popover, Progress, Select, Sheet, Sidebar, Slider, Switch, Table, Tabs, Textarea, Toast, Tooltip, etc.

### 11.2 Discovery (`components/discovery/`)
- `profile-card.tsx` — Card de perfil completo com badges e ações
- `filter-panel.tsx` — Painel de filtros avançados
- `match-modal.tsx` — Modal "É uma Conexão!"
- `report-modal.tsx` — Modal de denúncia

### 11.3 Landing (`components/landing/`)
- `landing-page.tsx` — Página landing completa
- `plans-comparison.tsx` — Tabela de comparação de planos
- `faq-section.tsx` — Seção FAQ
- `testimonials-section.tsx` — Depoimentos

### 11.4 Paywall (`components/paywall/`)
- `paywall-modal.tsx` — Modal de paywall
- `upgrade-banner.tsx` — Banner de upgrade

### 11.5 Offers (`components/offers/`)
- `offer-banner.tsx`, `offer-card.tsx`, `offer-modal.tsx`

---

## 12. Sistema de Planos e Entitlements

### 12.1 Arquitetura

```
Plan → PlanInterval (mensal/anual)
     → PlanModule (módulos incluídos)
     → FeatureLimit (limites por feature)

Feature → slug (identificador único)
        → type (BOOLEAN, LIMIT, UNLIMITED)
        → resetPeriod (DAILY, WEEKLY, MONTHLY, NEVER)
        → FeatureLimit → limitMode (HARD, SOFT)
                       → blockMessage, ctaText, upgradeUrl
```

### 12.2 Feature Slugs (não renomear!)

| Slug | Nome exibido | Tipo |
|---|---|---|
| `curtidas_por_dia` | Curtidas por dia | LIMIT (diário) |
| `super_curtidas_por_dia` | Sinais Fortes por dia | LIMIT (diário) |
| `mensagens_por_dia` | Mensagens por dia | LIMIT (diário) |
| `filtros_avancados` | Filtros avançados | BOOLEAN |
| `ver_quem_curtiu` | Ver quem curtiu | BOOLEAN |
| `passaporte` | Viagem global | BOOLEAN |
| `modo_invisivel` | Modo Discreto | BOOLEAN |
| `boost_perfil` | Impulso de perfil | LIMIT (mensal) |

### 12.3 Verificação de Entitlement no Código

```typescript
import { checkFeatureEntitlement } from '@/lib/entitlement-service';

const result = await checkFeatureEntitlement(userId, 'passaporte');
if (!result.allowed) {
  return NextResponse.json({ error: result.blockMessage, code: 'PREMIUM_REQUIRED' }, { status: 403 });
}
```

---

## 13. Motor de Descoberta

O motor de descoberta (`lib/discovery-engine.ts`) é responsável por:

1. **Filtrar** usuários elegíveis (exclui bloqueados, já interagidos, incógnitos)
2. **Calcular score** com base em compatibilidade, afinidade e proximidade
3. **Aplicar boost** para premium (premiumBoost, premiumDiscoveryBoost)
4. **Ordenar e paginar** resultados

Eventos de descoberta são registrados para melhorar recomendações futuras.

---

## 14. Motor de Compatibilidade

`lib/compatibility-engine.ts` calcula compatibilidade entre 2 usuários:

1. Coleta respostas de ambos por categoria
2. Calcula match ratio por categoria
3. Aplica pesos configuráveis (via `CompatibilityWeight` no DB)
4. Retorna score 0-100% com breakdown por categoria
5. Cacheia resultados em `CompatibilityCache`

---

## 15. Sistema de Governança de Perfil

`lib/profile-governance.ts` controla:

- Quais campos do perfil são obrigatórios
- Quais campos são visíveis por padrão
- Regras de visibilidade por nível de assinatura
- Configuração individual de visibilidade pelo usuário

---

## 16. Sistema Comercial

O sistema comercial engloba:

- **Campanhas** — Mensagens de upsell triggeradas por eventos (limite atingido, feature bloqueada, etc.)
- **Banners** — Banners promocionais por página
- **Ofertas** — Ofertas contextuais baseadas no comportamento do usuário
- **Cupons** — Códigos de desconto com validade e limites de uso
- **Paywall** — Modais de bloqueio quando recurso premium é necessário
- **Eventos Comerciais** — Tracking de interações comerciais

---

## 17. Sistema de Ads

- **AdZone** — Zonas de anúncio (feed, lista de conexões, cards, etc.)
- **AdCampaign** — Campanhas de anúncio com targeting
- **Impressions/Clicks** — Tracking de impressões e cliques
- **Configurações por plano** — Controle de quais ads aparecem por plano

---

## 18. Middleware e Segurança

### 18.1 middleware.ts
Protege rotas por autenticação e role. Funciona no Edge Runtime.

### 18.2 Boas Práticas
- Todos os API routes verificam `getServerSession(authOptions)` para autenticação
- Roles são verificados no token JWT
- Senhas são hashadas com bcryptjs
- CSRF é protegido pelo NextAuth
- Feature gating usa `checkFeatureEntitlement` server-side

---

## 19. Terminologia Oficial

IMPORTANTE: A terminologia do produto deve seguir este mapeamento:

| Interno (código/slug) | Exibido ao Usuário |
|---|---|
| match / matches | Conexão / Conexões |
| SUPERLIKE | Sinal Forte |
| boost_perfil | Impulso de perfil |
| passaporte | Viagem |
| modo_invisivel / incognitoMode | Modo Discreto |
| isVerified | Confirmado |
| curtida | Curtida (mantido) |

**Nunca renomeie** slugs internos, rotas de API, nomes de models Prisma, enum values, ou nomes de eventos de analytics.

---

## 20. Build e Deploy

### 20.1 Build Local

```bash
yarn build
```

### 20.2 Produção (standalone)

O Next.js é configurado para output `standalone` em produção:

```bash
NEXT_OUTPUT_MODE=standalone NEXT_DIST_DIR=.build yarn build
```

O artefato gerado fica em `.build/standalone/`.

### 20.3 Configurações de Produção

- `output: standalone` (em produção)
- Images: `unoptimized: true`
- ESLint: ignorado no build
- TypeScript: erros **não** são ignorados

---

## 21. Seeds e Dados Iniciais

### 21.1 Executar Seed

```bash
yarn tsx scripts/seed.ts
```

### 21.2 O que o seed cria

1. **Planos**: Gratuito e Premium (com intervalos mensal/anual)
2. **Módulos**: Busca, Perfil, Conexões, Chat, Viagem
3. **Features**: 8 features com limites por plano
4. **Feature Limits**: Configuração de limites free/premium
5. **Categorias de Perfil**: 11 categorias com opções
6. **Pesos de Compatibilidade**: Pesos padrão por categoria
7. **CMS Blocks**: Título, subtítulo, sobre, termos, privacidade
8. **Usuários Admin**: superadmin@evernow.com e admin@evernow.com

---

## 22. Troubleshooting

### Prisma Client não encontra DATABASE_URL
Certifique-se que o `.env` está no diretório correto (`nextjs_space/.env`).

### Erro de hydration
Evite usar `Date.now()`, `Math.random()` ou acessar `window`/`localStorage` diretamente no render. Use `useEffect` para operações client-side.

### NEXTAUTH_URL em produção
Não configure manualmente — é auto-definido pela plataforma de hosting. Arquivos que leem `process.env.NEXTAUTH_URL` devem ter `export const dynamic = "force-dynamic";`.

### Erro de conexão com DB
O banco usa `idle_session_timeout` curto e max 25 conexões. Não mantenha conexões abertas. Use o singleton Prisma de `lib/db.ts`.

### Build falha com TypeScript errors
`yarn tsc --noEmit` para verificar erros antes do build.

---

*Documentação técnica gerada em 14/04/2026 — EverNOW v1.0*
