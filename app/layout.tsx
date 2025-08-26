import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "react-datepicker/dist/react-datepicker.css";
import PolyfillLoader from "@/components/polyfills/PolyfillLoader";
import { ToastProvider } from "@/providers/ToastProvider";
import ThemeProvider from "@/providers/ThemeProvider";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

// Load the main body font (Inter)
const fontSans = localFont({
  src: "../public/fonts/Inter.woff2",
  display: "swap",
  variable: "--font-sans", // We'll use this for Tailwind's 'sans' class
  preload: true,
  fallback: ["system-ui", "arial"],
});

// Load the secondary heading font (Montserrat)
const fontHeading = localFont({
  src: "../public/fonts/Montserrat.woff2",
  display: "swap",
  variable: "--font-heading", // We'll use this for a custom 'heading' class
  preload: true,
  fallback: ["system-ui", "times new roman"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "cyan" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  applicationName: "Harinavi Transmission Maintenance",
  title: {
    default: "Harinavi Transmission Maintenance",
    template: "%s - PWA App",
  },
  description: "We provide reliable telecom transmission maintenance services.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Harinavi Transmission Maintenance",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    shortcut: "/favicon.ico",
    apple: [{ url: "/icon-192x192.png", sizes: "192x192" }],
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontHeading.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
        <PolyfillLoader />
      </body>
    </html>
  );
}
