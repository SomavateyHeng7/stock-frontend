import type { Metadata } from "next";
import { GlobalCommandPalette } from "@/components/global-command-palette";
import { NotificationEngine } from "@/components/notification-engine";
import { PreferencesProvider } from "@/components/preferences-provider";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartStock",
  description: "Minimal, mobile-first inventory decisions for SMEs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <PreferencesProvider>
          <ToastProvider>
            <NotificationEngine />
            <GlobalCommandPalette />
            {children}
          </ToastProvider>
        </PreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
