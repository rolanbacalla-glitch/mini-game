import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GamesDisclaimerFooter } from "@/components/GamesDisclaimerFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const SITE_URL = "https://games.rolanbacalla.online";
const SITE_TITLE = "Coffee Break — Restorative 3-Minute Browser Games";
const SITE_DESCRIPTION =
  "A calm collection of tactile, 2-to-4-minute daily browser puzzles built with the Antigravity v3.0 Design System.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  verification: {
    google: "6owHdHm79aL_eOwfX7Z1oPO6bsk4yO16l26nRwDiqMU",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Coffee Break",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('antigravity-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.toggle('dark',t==='dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-[var(--sys-color-surface-canvas)] text-[var(--sys-color-text-primary)] font-sans clerk-dot-canvas selection:bg-[var(--sys-color-bg-action-primary-subtle)] selection:text-[var(--sys-color-text-primary)]">
        <ThemeProvider>
          {children}
          <GamesDisclaimerFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
