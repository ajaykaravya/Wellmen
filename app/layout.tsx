import type { Metadata, Viewport } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ToastProvider from "./components/ToastProvider";

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WellMan Group",
  description: "WellMan Group",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
