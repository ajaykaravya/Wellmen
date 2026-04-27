import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ToastProvider from "./components/ToastProvider";
import AndroidBackButtonHandler from "./components/AndroidBackButtonHandler";
import ThemeProvider from "./components/ThemeProvider";

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
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const stored = localStorage.getItem("wellmen-theme");
                  const theme = stored === "dark" || stored === "light"
                    ? stored
                    : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.colorScheme = theme;
                } catch (error) {}
              })();
            `,
          }}
        />
        <ThemeProvider>
          <AndroidBackButtonHandler />
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
