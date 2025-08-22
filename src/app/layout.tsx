import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MainNav } from "@/components/main-nav";
import { AuthProvider } from "@/contexts/auth-context";
import { NavWrapper } from "@/components/nav-wrapper";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RecipeNest - Social Recipe Collections",
  description: "Create, share, and discover delicious recipes with a beautiful, simple interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NavWrapper>
            <div className="min-h-screen bg-background">
              <MainNav />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </NavWrapper>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
