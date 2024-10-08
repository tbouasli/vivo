import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import Image from "next/image";
import { Toaster } from "@/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Vivo Challenge",
  description: "Solucionando o desafio da Vivo",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
  } catch (e) {
    return (
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <main className="flex items-center justify-center h-screen">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <TriangleAlert
                  size={48}
                  className="text-red-500 mx-auto mb-4"
                />
                <CardTitle>Serviço fora do ar</CardTitle>
                <CardDescription className="text-center">
                  Desligamos o serviço temporariamente para economizar recursos.
                  Caso você queira solicitar a reativação, entre em contato
                  abrindo um issue no nosso{" "}
                  <Link
                    href="https://github.com/tbouasli/vivo"
                    className="text-blue-500"
                  >
                    github
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Image
                  src="/freezer.webp"
                  width={400}
                  height={400}
                  alt="Desligaram o freezer de noite"
                />
              </CardContent>
            </Card>
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
