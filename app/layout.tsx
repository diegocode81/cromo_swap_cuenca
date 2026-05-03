import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { SafetyBanner } from "@/components/safety-banner";

export const metadata: Metadata = {
  title: "CromoSwap Cuenca",
  description: "Intercambia cromos con personas de Cuenca de forma organizada y segura."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#f7fbf7] text-ink">
        <Providers>
          <Header />
          <SafetyBanner />
          <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
