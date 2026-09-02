import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Jurnalyst — Personal Finance & Investment Journal",
  description: "Aplikasi pencatatan arus kas, pemantauan portofolio, dan jurnal evaluasi investasi.",
  icons: {
    icon: "/Logo_Jurnalyst.png",
    shortcut: "/Logo_Jurnalyst.png",
    apple: "/Logo_Jurnalyst.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={cn(
        "h-full antialiased",
        plusJakartaSans.variable,
        fraunces.variable,
        ibmPlexMono.variable
      )}
    >
      <body className="min-h-full flex flex-col bg-[#F5F4F0] text-[#1A1F2E] font-sans">
        {children}
      </body>
    </html>
  );
}

