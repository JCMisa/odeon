import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Providers } from "@/components/custom/providers";
import { ThemeProvider } from "@/components/custom/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Odeon | Auth",
  description:
    "Odeon's authentication screen is designed for a seamless and secure entry into your personal AI music studio. Whether you're a new user or returning to your creations, our intuitive layout makes signing in or registering effortless. You can choose from Google, email/password options for quick and secure access. Your privacy and data are protected with robust, industry-standard authentication methods, ensuring a user-friendly and stress-free experience. Get to your music faster with Odeon's authentication—your fast pass to endless musical possibilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-svh flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children} <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
