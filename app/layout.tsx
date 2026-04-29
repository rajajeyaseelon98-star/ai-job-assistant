import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { OfflineStatusBanner } from "@/components/pwa/OfflineStatusBanner";
import { DevServiceWorkerReset } from "@/components/pwa/DevServiceWorkerReset";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "AI Job Assistant",
  description:
    "Improve your resume, match jobs, generate cover letters, and prepare for interviews with AI.",
  manifest: "/manifest.json",
  applicationName: "AI Job Assistant",
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Job Assistant",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <QueryProvider>
          <DevServiceWorkerReset />
          <OfflineStatusBanner />
          {children}
          <InstallAppButton />
        </QueryProvider>
      </body>
    </html>
  );
}
