import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { ClientAnalytics } from "@/components/ClientAnalytics";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
});

export const metadata: Metadata = {
  title: "ieltspracticebd - Expert IELTS Mock Tests",
  description: "Boost your IELTS score with professional mock tests, detailed feedback, and interactive learning. Clean, modern, and effective.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={hindSiliguri.variable} suppressHydrationWarning>
      <body className="antialiased font-hind-siliguri">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="3441bc13-0b31-4237-ad1f-67bfcefb743e"
        />
        <ErrorReporter />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <ClientAnalytics />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
          <VisualEditsMessenger />
        </ThemeProvider>
      </body>
    </html>
  );
}
