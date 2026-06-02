import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'DocuMind AI',
  description: 'AI Document Analyzer',
  verification: {
    google: '9OaOJJyNVDUO3f2HFQAuXqSCNSFj19avx2Cs57mOy_U',
  }, // <-- This was the missing closing brace!
  icons: {
    icon: "/icon.png", // This explicitly forces the browser to fetch your new logo
  },
};

export default function RootLayout({
  children,
}:{
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}