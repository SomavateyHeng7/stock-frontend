import type { Metadata } from "next";
import { GlobalCommandPalette } from "@/components/global-command-palette";
import { NotificationEngine } from "@/components/notification-engine";
import { PreferencesProvider } from "@/components/preferences-provider";
import localFont from "next/font/local";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const jakartaSans = localFont({
    src: "./fonts/PlusJakartaSans.woff2",
    variable: "--font-sans",
    weight: "300 800",
    display: "swap",
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
        className={`${jakartaSans.variable} h-full antialiased`}
      >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,100..700;1,100..700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
      <ThemeProvider defaultTheme="system" enableSystem>
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