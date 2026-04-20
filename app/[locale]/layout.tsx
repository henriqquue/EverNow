import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "EverNOW - Encontre sua conexão perfeita",
    template: "%s | EverNOW",
  },
  description: "Plataforma de relacionamento para quem busca relacionamento sério (Ever) ou encontro imediato (Now). Compatibilidade profunda, privacidade forte.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "EverNOW",
    title: "EverNOW - Encontre sua conexão perfeita",
    description: "Plataforma de relacionamento para quem busca relacionamento sério ou encontro imediato.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;
  console.log('Rendering RootLayout for locale:', locale);
  let messages;
  try {
    messages = await getMessages();
    console.log('Messages loaded successfully for:', locale);
  } catch (err) {
    console.error('Error loading messages for locale:', locale, err);
    // Fallback to PT if anything goes wrong
    try {
      messages = (await import(`../../messages/pt.json`)).default;
    } catch (e) {
      messages = {};
    }
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
