import type {
  Metadata,
} from "next";

import AppSplash from "@/components/AppSplash";

import BackgroundEffects from "@/components/BackgroundEffects";

import SessionHeartbeat from "@/components/SessionHeartbeat";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default:
      "BauerDutraFlix",

    template:
      "%s | BauerDutraFlix",
  },

  description:
    "Seu streaming pessoal de filmes e séries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
    >
      <body>
        <BackgroundEffects />

        <AppSplash />

        <SessionHeartbeat />

        <div
          className="app-content"
        >
          {children}
        </div>
      </body>
    </html>
  );
}