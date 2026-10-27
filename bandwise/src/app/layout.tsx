import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BandWise - IELTS Practice Platform",
  description: "Practice IELTS Reading, Listening, Writing, and Speaking with AI-powered feedback and detailed analytics.",
  keywords: ["IELTS", "English", "Practice", "Test", "Preparation", "AI Feedback", "Writing", "Speaking", "BandWise"],
  authors: [{ name: "BandWise" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bandwise.com",
    siteName: "BandWise",
    title: "BandWise - IELTS Practice Platform",
    description: "Practice IELTS Reading, Listening, Writing, and Speaking with AI-powered feedback.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BandWise - IELTS Practice Platform",
    description: "Practice IELTS Reading, Listening, Writing, and Speaking with AI-powered feedback.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-140px)]">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
