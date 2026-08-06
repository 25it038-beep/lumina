import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthScope } from "@/app/auth/AuthScope";

export const metadata: Metadata = {
  title: "Lumina — AI Presentation Generator",
  description:
    "Generate, edit, animate and export beautiful presentations with AI. Research, outline, design and present in minutes.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  openGraph: {
    title: "Lumina — AI Presentation Generator",
    description: "Generate beautiful presentations with AI in minutes.",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "Lumina" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Lumina — AI Presentation Generator",
    description: "Generate beautiful presentations with AI in minutes.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sora:wght@500;600;700&family=Space+Grotesk:wght@500;600;700&family=Playfair+Display:wght@600;700;800&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="dark" suppressHydrationWarning>
        <ClerkProvider>
          <AuthScope />
          {children}
        </ClerkProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(13,16,24,0.92)",
              border: "1px solid rgba(148,163,184,0.2)",
              color: "#e2e8f0",
              backdropFilter: "blur(12px)",
            },
          }}
        />
      </body>
    </html>
  );
}
