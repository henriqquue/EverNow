import { PrismaClient } from "@prisma/client";
import { PROFILE_OPTIONS } from "../lib/profile-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando sincronização de opções de perfil...");

  for (const [categorySlug, options] of Object.entries(PROFILE_OPTIONS)) {
    // Buscar a categoria pelo slug
    const category = await prisma.profileCategory.findUnique({
      where: { slug: categorySlug }
    });

    if (!category) {
      console.log(`⚠️ Categoria não encontrada: ${categorySlug}. Pulando...`);
      continue;
    }

    console.log(`Sincronizando categoria: ${category.name} (${categorySlug})...`);

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      
      // Upsert da opção principal
      const mainOption = await prisma.profileOption.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: opt.slug } },
        update: {
          name: opt.name,
          order: i + 1,
        },
        create: {
          categoryId: category.id,
          name: opt.name,
          slug: opt.slug,
          order: i + 1,
          isMultiple: true, // Permitir múltipla escolha por padrão para estas categorias
          status: "ACTIVE",
        }
      });

      // Se houver filhos (sub-opções)
      if (opt.children) {
        for (let j = 0; j < opt.children.length; j++) {
          const child = opt.children[j];
          await prisma.profileOption.upsert({
            where: { categoryId_slug: { categoryId: category.id, slug: child.slug } },
            update: {
              name: child.name,
              order: j + 1,
              parentId: mainOption.id,
            },
            create: {
              categoryId: category.id,
              name: child.name,
              slug: child.slug,
              order: j + 1,
              parentId: mainOption.id,
              status: "ACTIVE",
            }
          });
        }
      }
    }
  }

  console.log("✅ Sincronização concluída!");
}

main()
  .catch((e) => {
    console.error("Erro na sincronização:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
