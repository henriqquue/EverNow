import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacidadePage() {
  const t = useTranslations('Common');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h1 className="font-bold text-lg">Política de Privacidade</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-10 shadow-sm border border-neutral-100 dark:border-neutral-800 prose dark:prose-invert max-w-none">
          
          <p className="text-sm text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <h2>1. Coleta de Dados</h2>
          <p>
            [Cole o texto sobre quais dados o aplicativo coleta aqui...]
          </p>

          <h2>2. Uso das Informações</h2>
          <p>
            [Cole o texto explicando como a plataforma usa os dados para matches e funcionamento aqui...]
          </p>

          <h2>3. Exclusão de Conta e Dados (LGPD)</h2>
          <p>
            [MUITO IMPORTANTE PARA A APPLE: Cole o texto ensinando como o usuário deleta a conta e como os dados são apagados do sistema aqui...]
          </p>

          <h2>4. Compartilhamento de Dados</h2>
          <p>
            [Cole o texto aqui...]
          </p>

        </div>
      </main>
    </div>
  );
}
