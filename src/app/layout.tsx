import type { Metadata } from "next";
import { GlobalCommandPalette } from "@/components/global-command-palette";
import { NotificationEngine } from "@/components/notification-engine";
import { PreferencesProvider } from "@/components/preferences-provider";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
    variable: "--font-sans",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
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