import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermosDeUsoPage() {
  const t = useTranslations('Common'); // Usaremos o common temporariamente até termos traduções específicas

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
            <FileText className="w-5 h-5 text-indigo-600" />
            <h1 className="font-bold text-lg">Termos de Uso</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-10 shadow-sm border border-neutral-100 dark:border-neutral-800 prose dark:prose-invert max-w-none">
          
          <p className="text-sm text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <h2>1. Aceitação dos Termos</h2>
          <p>
            [Cole o texto dos termos de uso aqui...]
          </p>

          <h2>2. Elegibilidade</h2>
          <p>
            [Cole o texto aqui...]
          </p>

          <h2>3. Regras de Conduta</h2>
          <p>
            [Cole o texto aqui...]
          </p>

          {/* Adicione mais seções conforme a necessidade do seu documento final */}

        </div>
      </main>
    </div>
  );
}
