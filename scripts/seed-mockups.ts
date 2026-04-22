import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Dados mockups organizados por cidade e categoria
const mockupUsers = [
  // Rio de Janeiro - Viajantes/Aventureiros
  {
    email: "lucas.viajante@email.com",
    name: "Lucas Mendes",
    gender: "MALE" as const,
    city: "Rio de Janeiro",
    state: "RJ",
    bio: "Amante de viagens e aventuras. Sempre buscando novos lugares! 🌍",
    interests: ["Viagem", "Hiking", "Fotografia", "Culinária", "Praia"],
    orientation: "Heterossexual",
    lookingFor: "CASUAL" as const,
  },
  {
    email: "sofia.carioca@email.com",
    name: "Sofia Lima",
    gender: "FEMALE" as const,
    city: "Rio de Janeiro",
    state: "RJ",
    bio: "Carioca de corpo e alma. Amo praias e bom papo 🏖️",
    interests: ["Praia", "Música", "Arte", "Cinema", "Yoga"],
    orientation: "Heterossexual",
    lookingFor: "SERIOUS" as const,
  },
  {
    email: "bruno.aventura@email.com",
    name: "Bruno Costa",
    gender: "MALE" as const,
    city: "Rio de Janeiro",
    state: "RJ",
    bio: "Escalador, surfer e apaixonado pela natureza!",
    interests: ["Esportes", "Natureza", "Viagem", "Fotografia", "Surf"],
    orientation: "Heterossexual",
    lookingFor: "OPEN" as const,
  },

  // São Paulo - Profissionais/Carreira
  {
    email: "ana.empresaria@email.com",
    name: "Ana Patricia",
    gender: "FEMALE" as const,
    city: "São Paulo",
    state: "SP",
    bio: "Executiva ambiciosa. Adoro wine e boas conversas 🍷",
    interests: ["Carreira", "Networking", "Vinho", "Teatro", "Leitura"],
    orientation: "Heterossexual",
    lookingFor: "SERIOUS" as const,
  },
  {
    email: "diego.tech@email.com",
    name: "Diego Rocha",
    gender: "MALE" as const,
    city: "São Paulo",
    state: "SP",
    bio: "Dev apaixonado, nerd assumido e cinéfilo. Marvel > DC!",
    interests: ["Tecnologia", "Cinema", "Games", "Série", "Programação"],
    orientation: "Heterossexual",
    lookingFor: "FRIENDSHIP" as const,
  },
  {
    email: "isabella.paulista@email.com",
    name: "Isabella Santos",
    gender: "FEMALE" as const,
    city: "São Paulo",
    state: "SP",
    bio: "Produtora de eventos. Sempre em busca de novas experiências!",
    interests: ["Eventos", "Música", "Gastronomia", "Dança", "Festas"],
    orientation: "Heterossexual",
    lookingFor: "CASUAL" as const,
  },

  // Belo Horizonte - Artistas/Criadores
  {
    email: "rafael.artista@email.com",
    name: "Rafael Gomes",
    gender: "MALE" as const,
    city: "Belo Horizonte",
    state: "MG",
    bio: "Pintor e muralista. A arte é minha vida! 🎨",
    interests: ["Arte", "Pintura", "Galeria", "Exposição", "Criatividade"],
    orientation: "Heterossexual",
    lookingFor: "SERIOUS" as const,
  },
  {
    email: "camila.musica@email.com",
    name: "Camila Ferreira",
    gender: "FEMALE" as const,
    city: "Belo Horizonte",
    state: "MG",
    bio: "Cantora independente. Música é a minha linguagem 🎵",
    interests: ["Música", "Composição", "Shows", "Poesia", "Performances"],
    orientation: "Heterossexual",
    lookingFor: "OPEN" as const,
  },

  // Salvador - Esporte/Wellness
  {
    email: "marcos.fitness@email.com",
    name: "Marcos Alves",
    gender: "MALE" as const,
    city: "Salvador",
    state: "BA",
    bio: "Personal trainer. Saúde é riqueza! Vamo treinar? 💪",
    interests: ["Fitness", "Esporte", "Nutrição", "Wellness", "Academia"],
    orientation: "Heterossexual",
    lookingFor: "CASUAL" as const,
  },
  {
    email: "yasmin.yoga@email.com",
    name: "Yasmin Oliveira",
    gender: "FEMALE" as const,
    city: "Salvador",
    state: "BA",
    bio: "Instrutora de yoga e meditação. Busco equilíbrio e paz 🧘‍♀️",
    interests: ["Yoga", "Meditação", "Wellness", "Natureza", "Espiritualidade"],
    orientation: "Heterossexual",
    lookingFor: "SERIOUS" as const,
  },

  // Curitiba - Intelectuais/Educadores
  {
    email: "lucas.professor@email.com",
    name: "Lucas Machado",
    gender: "MALE" as const,
    city: "Curitiba",
    state: "PR",
    bio: "Professor de filosofia. Adoro debates e bom café ☕",
    interests: ["Educação", "Filosofia", "Literatura", "Debate", "Livros"],
    orientation: "Heterossexual",
    lookingFor: "SERIOUS" as const,
  },
  {
    email: "laura.pesquisadora@email.com",
    name: "Laura Costa",
    gender: "FEMALE" as const,
    city: "Curitiba",
    state: "PR",
    bio: "Pesquisadora. Curiosa por natureza 🔬",
    interests: ["Ciência", "Pesquisa", "Documentários", "Museu", "Aprendizado"],
    orientation: "Heterossexual",
    lookingFor: "OPEN" as const,
  },

  // Porto Alegre - Gastronomia/Cultura
  {
    email: "fernando.chef@email.com",
    name: "Fernando Silva",
    gender: "MALE" as const,
    city: "Porto Alegre",
    state: "RS",
    bio: "Chef de cozinha. Comida é amor no prato! 👨‍🍳",
    interests: ["Culinária", "Gastronomia", "Vinho", "Receitas", "Cozinha"],
    orientation: "Heterossexual",
    lookingFor: "CASUAL" as const,
  },
  {
    email: "carolina.cultural@email.com",
    name: "Carolina Vieira",
    gender: "FEMALE" as const,
    city: "Porto Alegre",
    state: "RS",
    bio: "Curadora cultural. Apaixonada por história e arte 🎭",
    interests: ["Cultura", "História", "Arte", "Museu", "Patrimônio"],
    orientation: "Heterossexual",
    lookingFor: "SERIOUS" as const,
  },
];

async function main() {
  console.log("🌱 Iniciando seed de usuários mockups...");

  try {
    // Buscar plano gratuito (deve estar criado pelo seed.ts)
    const freePlan = await prisma.plan.findUnique({
      where: { slug: "gratuito" },
    });

    if (!freePlan) {
      throw new Error(
        "Plano 'gratuito' não encontrado. Execute seed.ts primeiro!"
      );
    }

    const password = await bcrypt.hash("senha123", 12);

    // Criar usuários
    const createdUsers = [];
    for (const userData of mockupUsers) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          passwordHash: password,
          name: userData.name,
          gender: userData.gender,
          city: userData.city,
          state: userData.state,
          country: "Brasil",
          orientation: userData.orientation,
          lookingFor: userData.lookingFor,
          bio: userData.bio,
          interests: userData.interests,
          role: "USER",
          status: "ACTIVE",
          planId: freePlan.id,
          profileComplete: 75,
          onboardingComplete: true,
        },
      });

      createdUsers.push(user);
      console.log(`✅ Usuário criado: ${userData.name} (${userData.city})`);
    }

    // Criar alguns likes entre usuários
    console.log("\n💕 Criando likes e interações...");
    const likes = [
      [createdUsers[0], createdUsers[1]], // Lucas gosta de Sofia
      [createdUsers[1], createdUsers[0]], // Sofia gosta de Lucas (MATCH!)
      [createdUsers[2], createdUsers[1]], // Bruno gosta de Sofia
      [createdUsers[3], createdUsers[4]], // Ana gosta de Diego
      [createdUsers[4], createdUsers[3]], // Diego gosta de Ana (MATCH!)
      [createdUsers[5], createdUsers[6]], // Isabella gosta de Rafael
      [createdUsers[6], createdUsers[7]], // Rafael gosta de Camila
      [createdUsers[7], createdUsers[6]], // Camila gosta de Rafael (MATCH!)
      [createdUsers[8], createdUsers[9]], // Marcos gosta de Yasmin
      [createdUsers[10], createdUsers[11]], // Lucas gosta de Laura
      [createdUsers[11], createdUsers[10]], // Laura gosta de Lucas (MATCH!)
      [createdUsers[12], createdUsers[13]], // Fernando gosta de Carolina
    ];

    for (const [fromUser, toUser] of likes) {
      await prisma.like.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: fromUser.id,
            toUserId: toUser.id,
          },
        },
        update: {},
        create: {
          fromUserId: fromUser.id,
          toUserId: toUser.id,
          type: "LIKE",
        },
      });
      console.log(`❤️ ${fromUser.name} curtiu ${toUser.name}`);
    }

    // Criar matches (quando há like bilateral)
    console.log("\n🎉 Criando matches...");
    const matches = [
      [createdUsers[0], createdUsers[1]], // Lucas <-> Sofia
      [createdUsers[3], createdUsers[4]], // Ana <-> Diego
      [createdUsers[6], createdUsers[7]], // Rafael <-> Camila
      [createdUsers[10], createdUsers[11]], // Lucas <-> Laura
    ];

    for (const [user1, user2] of matches) {
      const match = await prisma.match.upsert({
        where: {
          user1Id_user2Id: {
            user1Id: user1.id,
            user2Id: user2.id,
          },
        },
        update: {},
        create: {
          user1Id: user1.id,
          user2Id: user2.id,
          status: "ACTIVE",
        },
      });

      // Criar chat thread para o match
      await prisma.chatThread.create({
        data: {
          matchId: match.id,
        },
      });

      console.log(`💬 Match criado: ${user1.name} <-> ${user2.name}`);
    }

    // Criar algumas mensagens de teste
    console.log("\n📱 Criando mensagens de teste...");
    const matches_with_threads = await prisma.match.findMany({
      include: { chatThread: true },
      take: 2,
    });

    const mensagens = [
      "Oi! Como você está? 😊",
      "Que legal seu perfil! Adorei conhecer você",
      "Bora tomar um café em breve? ☕",
      "Que coincidência gostosa! 😄",
    ];

    for (const match of matches_with_threads) {
      if (match.chatThread) {
        for (let i = 0; i < 2; i++) {
          const senderUser = i % 2 === 0 ? match.user1Id : match.user2Id;
          await prisma.chatMessage.create({
            data: {
              threadId: match.chatThread.id,
              senderId: senderUser,
              content: mensagens[i],
              status: "DELIVERED",
            },
          });
        }
        console.log(`✉️ Mensagens criadas no chat entre usuários`);
      }
    }

    console.log("\n✨ Seed de mockups concluído com sucesso!");
    console.log(`
    📊 Resumo:
    - ${createdUsers.length} usuários criados
    - ${likes.length} likes criados
    - ${matches.length} matches criados
    - Mensagens de teste adicionadas

    🧪 Para testar, use estas credenciais:
    Email: lucas.viajante@email.com
    Senha: senha123

    Email: sofia.carioca@email.com
    Senha: senha123
    `);
  } catch (error) {
    console.error("❌ Erro durante seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
