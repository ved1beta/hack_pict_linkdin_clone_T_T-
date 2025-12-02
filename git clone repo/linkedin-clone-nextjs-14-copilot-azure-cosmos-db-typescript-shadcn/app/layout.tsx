import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HEXjuy's - Student Professional Network",
  description: "Connect, collaborate, and grow with fellow students and teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
          <Header />
          <main className="bg-background min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}