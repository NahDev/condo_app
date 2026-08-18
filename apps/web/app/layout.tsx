import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Condominus",
  description: "Gestão condominial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-light-bg-muted text-light-text dark:bg-dark-bg dark:text-dark-text">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
