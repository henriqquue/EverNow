# EverNOW — Documentação Completa do Usuário

> Plataforma de relacionamento com compatibilidade profunda, privacidade forte e dois modos de uso: **Ever** (relacionamentos sérios) e **Now** (encontros imediatos).

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Primeiros Passos](#2-primeiros-passos)
3. [Onboarding](#3-onboarding)
4. [Dashboard](#4-dashboard)
5. [Descobrir Perfis](#5-descobrir-perfis)
6. [Conexões (Matches)](#6-conexões-matches)
7. [Conversas (Chat)](#7-conversas-chat)
8. [Viagem (Passaporte Virtual)](#8-viagem-passaporte-virtual)
9. [Sair Hoje (Modo Encontro)](#9-sair-hoje-modo-encontro)
10. [Meu Perfil](#10-meu-perfil)
11. [Planos e Assinatura](#11-planos-e-assinatura)
12. [Configurações](#12-configurações)
13. [Funcionalidades Premium](#13-funcionalidades-premium)
14. [Segurança e Privacidade](#14-segurança-e-privacidade)
15. [Painel Admin](#15-painel-admin)
16. [Painel SuperAdmin](#16-painel-superadmin)
17. [Glossário de Termos](#17-glossário-de-termos)

---

## 1. Visão Geral

O **EverNOW** é uma plataforma de relacionamento dividida em dois modos:

- **Ever** — Para quem busca relacionamentos sérios. Usa compatibilidade profunda baseada em valores, personalidade e estilo de vida.
- **Now** — Para encontros imediatos. Conecta pessoas disponíveis na mesma região em tempo real.

A plataforma oferece:
- Algoritmo de compatibilidade com mais de 100 variáveis
- Sistema de Sinais Fortes (destaque premium)
- Viagem pelo mundo (explorar perfis em outras cidades)
- Modo Discreto (navegar sem ser visto)
- Sistema completo de chat em tempo real
- Modo "Sair Hoje" para encontros presenciais
- Perfis Confirmados (verificação de identidade)
- Plano Gratuito e Premium com recursos avançados

---

## 2. Primeiros Passos

### 2.1 Cadastro

1. Acesse a página inicial do EverNOW
2. Clique em **"Comece agora"**
3. Preencha: nome, e-mail e senha
4. A senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números
5. Confirme a senha e clique em **"Criar conta"**
6. Você será redirecionado para o onboarding

### 2.2 Login

1. Acesse `/login`
2. Insira seu e-mail e senha
3. Clique em **"Entrar"**
4. Em caso de erro, verifique suas credenciais

### 2.3 Recuperação de Senha

1. Na tela de login, clique em **"Esqueceu sua senha?"**
2. Insira seu e-mail cadastrado
3. Você receberá um link de redefinição
4. Siga as instruções no e-mail recebido

---

## 3. Onboarding

Após o cadastro, você passará por um processo de onboarding que ajuda o algoritmo a entender seu perfil:

### Categorias do Onboarding

| Categoria | O que é perguntado |
|---|---|
| **Básico** | Gênero, idade, quem você procura |
| **Intenção** | Tipo de relacionamento desejado |
| **Aparência** | Preferências de aparência |
| **Família** | Planos familiares, filhos |
| **Religião** | Crenças e importância da religião |
| **Estilo de Vida** | Rotina, hábitos, hobbies |
| **Hábitos** | Tabagismo, álcool, atividades |
| **Cultura** | Música, filmes, livros, viagens |
| **Pets** | Animais de estimação |
| **Profissão** | Carreira, ambições |
| **Encontro** | Preferências para encontros |

Cada resposta contribui para o cálculo de compatibilidade com outros usuários.

Você também define a **importância** de cada categoria (Indiferente, Leve, Moderada, Alta, Fundamental), que influencia o peso no algoritmo.

---

## 4. Dashboard

O dashboard (`/app`) é sua página principal após o login. Ele exibe:

- **Banner de upgrade** (se for usuário gratuito) — convida a desbloquear sinais fortes, curtidas ilimitadas etc.
- **Estatísticas rápidas:**
  - Curtidas recebidas
  - Visualizações do perfil
  - Conexões
  - Conversas ativas

---

## 5. Descobrir Perfis

A página **Descobrir** (`/app/descobrir`) é onde você encontra novas pessoas.

### 5.1 Como funciona

- O algoritmo de descoberta analisa compatibilidade, localização e preferências
- Perfis são apresentados em cards com foto, nome, idade, cidade e porcentagem de compatibilidade
- Cada perfil mostra badges como: Online, Confirmado, Premium, Quer sair hoje

### 5.2 Ações disponíveis

| Ação | Descrição |
|---|---|
| **Curtida** | Demonstra interesse (limitado no plano gratuito) |
| **Sinal Forte** | Curtida especial que destaca seu perfil para a outra pessoa (recurso premium) |
| **Pular** | Passa para o próximo perfil |

### 5.3 Filtros Avançados

O painel de filtros permite refinar a busca:
- Distância / localização
- Faixa etária
- Gênero
- Apenas confirmados
- Online recentemente
- Modo de relacionamento (Ever ou Now)
- Diversos filtros de estilo de vida

> Filtros avançados são um recurso **Premium**.

### 5.4 Quando há uma Conexão

Quando você e outra pessoa se curtem mutuamente, aparece o modal **"É uma Conexão!"** com a opção de enviar mensagem ou continuar descobrindo.

---

## 6. Conexões (Matches)

A página **Conexões** (`/app/matches`) exibe:

### 6.1 Aba "Conexões"
- Lista de todas as conexões mútuas
- Busca por nome
- Filtros: Todos / Não lidos / Novos
- Cada card mostra: foto, nome, cidade, última mensagem ou badge "Nova conexão!"
- Ação de desfazer conexão com confirmação

### 6.2 Aba "Curtidas"
- Lista de pessoas que curtiram seu perfil
- Curtidas com Sinal Forte são destacadas com ícone especial
- No plano gratuito, as fotos podem estar desfocadas (recurso "Ver quem curtiu" é premium)

---

## 7. Conversas (Chat)

A página **Conversas** (`/app/conversas`) lista todas as suas conversas ativas.

### Funcionalidades do Chat
- Lista de conversas com prévia da última mensagem
- Busca por nome
- Indicador de mensagens não lidas
- Tela de chat individual (`/app/chat/[threadId]`):
  - Envio de mensagens de texto
  - Reações a mensagens
  - Indicador de status (online/offline)
  - Link para ver perfil completo

---

## 8. Viagem (Passaporte Virtual)

A página **Viagem** (`/app/passaporte`) permite explorar e aparecer em outras cidades do mundo.

> **Recurso Premium** — requer assinatura ativa.

### 8.1 Viagem Atual
- Defina cidade e país
- Opções:
  - **Explorar** — ver pessoas desta cidade
  - **Aparecer** — ser visível para pessoas desta cidade
- Botão **"Ativar viagem"** / **"Desativar"**

### 8.2 Viagens Programadas
- Agende viagens futuras com datas de início e fim
- A viagem ativa automaticamente na data programada
- Gerencie múltiplas viagens programadas

---

## 9. Sair Hoje (Modo Encontro)

A página **Sair Hoje** (`/app/sair-hoje`) conecta pessoas disponíveis para sair no mesmo dia.

- Ative o modo indicando:
  - Tipo de atividade (café, jantar, drinks, passeio, etc.)
  - Horário disponível
  - Local preferido
- Veja quem mais está disponível hoje
- Facilita encontros presenciais rápidos

---

## 10. Meu Perfil

A página **Meu Perfil** (`/app/perfil`) permite gerenciar suas informações.

### 10.1 Informações Exibidas
- Foto principal e galeria
- Nome, idade, cidade
- Bio/descrição
- Respostas do onboarding organizadas por categoria
- Indicador de completude do perfil
- Dica: "Perfis mais completos recebem até 3x mais conexões!"

### 10.2 Ver Perfil de Outros
Ao clicar no perfil de outra pessoa (`/app/perfil/[userId]`):
- Foto, nome, idade, cidade
- Porcentagem de compatibilidade
- Badge de Confirmado (se verificado)
- Respostas e preferências compartilhadas
- Ações: curtir, enviar sinal forte, denunciar, bloquear

---

## 11. Planos e Assinatura

### 11.1 Plano Gratuito
| Recurso | Limite |
|---|---|
| Curtidas por dia | 5 |
| Sinais Fortes por dia | 1 |
| Mensagens por dia | Limitado |
| Filtros avançados | ❌ |
| Ver quem curtiu | ❌ |
| Viagem global | ❌ |
| Modo Discreto | ❌ |
| Impulso de perfil | ❌ |

### 11.2 Plano Premium
| Recurso | Acesso |
|---|---|
| Curtidas por dia | Ilimitadas |
| Sinais Fortes por dia | 5 |
| Mensagens por dia | Ilimitadas |
| Filtros avançados | ✅ |
| Ver quem curtiu | ✅ |
| Viagem global | ✅ |
| Modo Discreto | ✅ |
| Impulsos de perfil/mês | Incluídos |

### 11.3 Gerenciar Assinatura
- **Minha Assinatura** (`/app/assinatura`) — veja seu plano atual, status, data de expiração
- **Ver Planos** (`/app/planos`) — compare planos lado a lado
- **Trocar Plano** (`/app/assinatura/trocar`) — upgrade ou downgrade
- **Checkout** (`/checkout`) — finalizar pagamento
- Cupons de desconto podem ser aplicados na compra
- Cancelamento disponível a qualquer momento (acesso continua até fim do período)

---

## 12. Configurações

A página **Configurações** (`/app/configuracoes`) oferece:

### 12.1 Dados da Conta
- Alterar nome, e-mail, senha
- Excluir conta

### 12.2 Notificações
- Novas conexões
- Novas mensagens
- Curtidas recebidas
- Promoções e novidades

### 12.3 Privacidade
- **Modo Discreto** — Ocultar seu perfil da descoberta (Premium)
- Controle de visibilidade de campos do perfil
- Configurações de quem pode ver suas informações

---

## 13. Funcionalidades Premium

| Funcionalidade | Descrição |
|---|---|
| **Curtidas Ilimitadas** | Sem limite diário para curtir perfis |
| **Sinais Fortes** | Destaque-se para quem te interessa — a pessoa vê que você tem interesse especial |
| **Impulso de Perfil** | Seu perfil aparece para mais pessoas por um período |
| **Viagem** | Explore e apareça em qualquer cidade do mundo |
| **Modo Discreto** | Navegue sem ser visto na descoberta |
| **Ver quem curtiu** | Descubra quem se interessou por você antes de curtir de volta |
| **Filtros Avançados** | Filtre por critérios detalhados |
| **Perfil Confirmado** | Badge de verificação que aumenta confiança |

---

## 14. Segurança e Privacidade

### 14.1 Verificação de Perfil (Perfil Confirmado)
- Solicite verificação em `/api/verification`
- Envie foto ou documento para comprovar identidade
- Após aprovação pelo admin, você recebe o badge **"Confirmado"**

### 14.2 Denúncias
- Denuncie perfis por: conteúdo inapropriado, assédio, perfil falso, spam, etc.
- As denúncias são revisadas pela equipe de moderação

### 14.3 Bloqueio
- Bloqueie usuários indesejados
- Usuários bloqueados não aparecem na sua descoberta e vice-versa

### 14.4 Modo Discreto
- Quando ativado, seu perfil não aparece na descoberta de outros usuários
- Você continua podendo navegar normalmente
- Requer plano Premium

---

## 15. Painel Admin

Acessível em `/admin` para usuários com role **ADMIN** ou **SUPERADMIN**.

### Funcionalidades:
- **Dashboard** — Visão geral: total de usuários, novos hoje, denúncias pendentes, verificações pendentes
- **Usuários** (`/admin/usuarios`) — Lista, busca e filtro de usuários por status
- **Moderação** (`/admin/moderacao`) — 3 abas:
  - **Denúncias** — Analisar, resolver ou descartar denúncias
  - **Verificações** — Aprovar ou rejeitar pedidos de verificação
  - **Histórico** — Registro de ações de moderação
- **Relatórios** (`/admin/relatorios`) — Métricas de cadastros, usuários ativos, assinaturas, conversão

---

## 16. Painel SuperAdmin

Acessível em `/superadmin` apenas para usuários com role **SUPERADMIN**.

### 16.1 Dashboard
- Total de usuários, assinantes, receita recorrente, taxa de conversão, distribuição de planos

### 16.2 Módulos de Gestão

| Página | Função |
|---|---|
| **Planos** (`/superadmin/planos`) | Criar, editar, duplicar, ativar/desativar planos |
| **Módulos** (`/superadmin/modulos`) | Gerenciar módulos do sistema |
| **Funcionalidades** (`/superadmin/funcionalidades`) | Gerenciar features e limites por plano |
| **Assinaturas** (`/superadmin/assinaturas`) | Visualizar e filtrar assinaturas de usuários |
| **Métricas** (`/superadmin/metricas`) | Métricas detalhadas do sistema |
| **Comercial** (`/superadmin/comercial`) | Dashboard comercial com métricas de feature usage |
| **Campanhas** (`/superadmin/campanhas`) | Criar e gerenciar campanhas de upsell/paywall |
| **Banners** (`/superadmin/banners`) | Gerenciar banners promocionais |
| **CMS** (`/superadmin/cms`) | Editar blocos de conteúdo (hero, termos, etc.) |
| **Landing** (`/superadmin/landing`) | Configurar seções, FAQs, depoimentos, SEO da landing page |
| **Anúncios** (`/superadmin/anuncios`) | Gerenciar zonas de anúncios e campanhas de ads |
| **Cupons** (`/superadmin/cupons`) | Criar e gerenciar cupons de desconto |
| **Compatibilidade** (`/superadmin/compatibilidade`) | Ajustar pesos do algoritmo de compatibilidade |
| **Perfil Governança** (`/superadmin/perfil-governanca`) | Regras de governança de campos do perfil |

---

## 17. Glossário de Termos

| Termo | Significado |
|---|---|
| **Conexão** | Quando duas pessoas se curtem mutuamente |
| **Curtida** | Demonstração de interesse em um perfil |
| **Sinal Forte** | Curtida premium que destaca seu interesse especial |
| **Impulso de Perfil** | Recurso que aumenta temporariamente a visibilidade do seu perfil |
| **Viagem** | Recurso para explorar perfis em outras cidades |
| **Viagem Programada** | Viagem agendada para ativar automaticamente em datas futuras |
| **Modo Discreto** | Modo de privacidade que oculta seu perfil da descoberta |
| **Confirmado** | Badge de perfil verificado pela equipe de moderação |
| **Ever** | Modo para relacionamentos sérios |
| **Now** | Modo para encontros imediatos |
| **Sair Hoje** | Modo de encontro presencial no mesmo dia |
| **Paywall** | Tela ou aviso que aparece quando um recurso premium é necessário |
| **Onboarding** | Processo inicial de configuração do perfil |

---

*Documentação gerada em 14/04/2026 — EverNOW v1.0*
