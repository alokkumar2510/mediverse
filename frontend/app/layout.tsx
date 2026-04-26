import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MediVerse AI — AI-Powered Healthcare Screening",
    template: "%s | MediVerse AI",
  },
  description:
    "MediVerse AI delivers instant, AI-powered medical screening for X-ray, ECG, skin conditions, diabetes, prescription OCR, and symptom analysis — all in one secure platform.",
  keywords: [
    "AI healthcare",
    "medical screening",
    "X-ray analysis",
    "ECG analysis",
    "diabetes prediction",
    "skin disease AI",
    "prescription OCR",
    "symptom checker",
    "MediVerse",
  ],
  authors: [{ name: "MediVerse AI", url: "https://mediverse.alokkumarsahu.in" }],
  creator: "Alok Kumar Sahu",
  metadataBase: new URL("https://mediverse.alokkumarsahu.in"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mediverse.alokkumarsahu.in",
    siteName: "MediVerse AI",
    title: "MediVerse AI — AI-Powered Healthcare Screening",
    description:
      "Instant AI-powered medical screening: X-ray, ECG, skin, diabetes, prescription OCR & symptom checker.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MediVerse AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MediVerse AI",
    description: "AI-powered healthcare screening platform.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1221" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakarta.variable}`}
    >
      <body
        className="antialiased min-h-screen"
        style={{
          fontFamily: "var(--font-inter), Inter, system-ui, -apple-system, sans-serif",
          backgroundColor: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}