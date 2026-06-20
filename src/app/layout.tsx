import { Raleway } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

import { AppProvider, ErrorBoundary, QueryProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cairn",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${raleway.variable} h-full antialiased`}>
      <ErrorBoundary>
        <QueryProvider>
          <AppProvider>
            <body className="min-h-full">
              {children}
              <Toaster />
            </body>
          </AppProvider>
        </QueryProvider>
      </ErrorBoundary>
    </html>
  );
}
