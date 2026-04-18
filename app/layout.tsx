import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProvider from "@/components/AppProvider";
import ThemeProvider, { ThemeScript } from "@/components/ThemeProvider";
import GlobalCursor from "@/components/GlobalCursor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Carreriq — Career Intelligence Platform",
  description: "Understand where you stand, what you're missing, and how to get there.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <AppProvider>
            {/* Cursor lives here — renders on every page */}
            <GlobalCursor />
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
