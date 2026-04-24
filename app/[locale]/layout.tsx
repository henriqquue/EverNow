import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "../globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

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
  
  let messages;
  try {
    messages = await getMessages();
  } catch (err) {
    console.error('Error loading messages for locale:', locale, err);
    try {
      messages = (await import(`../../messages/pt.json`)).default;
    } catch (e) {
      messages = {};
    }
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <Script 
          src="https://apps.abacus.ai/chatllm/appllm-lib.js" 
          strategy="lazyOnload"
        />
        {process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
            strategy="lazyOnload"
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${inter.className} antialiased overflow-x-hidden`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
