import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import NotificationProvider from "@/components/providers/NotificationProvider";
import NotificationContainer from "@/components/ui/NotificationContainer";
import "./globals.css";

// Import Leaflet CSS globally for map components
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Match - La forma inteligente de estacionar",
  description: "Encuentra y reserva cocheras en Buenos Aires de forma rápida y segura",
  icons: {
    icon: "/MatchLogo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <NotificationProvider>
            {children}
            <NotificationContainer />
          </NotificationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
