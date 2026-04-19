# EverNOW — Guia de Instalação Rápida

## Pré-requisitos
- **Node.js** >= 18.x
- **Yarn** (gerenciador de pacotes)
- **PostgreSQL** >= 14.x

## 1. Instalar dependências
```bash
yarn install
```

## 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas credenciais de banco e segredo NextAuth
```

## 3. Configurar banco de dados
```bash
# Gerar o Prisma Client
yarn prisma generate

# Criar as tabelas no banco
yarn prisma db push

# Executar seed (dados iniciais: planos, módulos, features, CMS, admin)
yarn prisma db seed
```

## 4. Executar em desenvolvimento
```bash
yarn dev
```
O app estará disponível em `http://localhost:3000`

## 5. Build para produção
```bash
yarn build
yarn start
```

## Contas padrão (após seed)
| Papel       | Email                  | Senha      |
|-------------|------------------------|------------|
| Superadmin  | superadmin@evernow.com | Super@123  |
| Admin       | admin@evernow.com      | Admin@123  |

## Estrutura de diretórios
```
app/           → Rotas (App Router Next.js 14)
  api/         → API Routes (~90 endpoints)
  (authenticated)/ → Páginas protegidas
components/    → Componentes React reutilizáveis
lib/           → Lógica de negócio e utilitários
prisma/        → Schema do banco (63 modelos)
scripts/       → Seeds e scripts de manutenção
public/        → Assets estáticos e documentação
```

## Documentação
- `public/docs/DOCUMENTACAO_USUARIO.md` — Manual do usuário (PT-BR)
- `public/docs/DOCUMENTACAO_DEV.md` — Documentação técnica completa
