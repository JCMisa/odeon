import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/custom/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/custom/providers";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/AppSidebar";
import { cookies } from "next/headers";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import BreadCrumbPageClient from "@/components/custom/BreadCrumbPageClient";
import ModeToggle from "@/components/custom/ModeToggle";
import LogoutButton from "./_components/LogoutButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Odeon",
  description:
    "Unleash your inner composer with Odeon, the revolutionary AI music generator that puts the power of an entire orchestra in your pocket. Whether you're a seasoned musician looking for fresh inspiration or a curious beginner eager to explore the world of sound, Odeon makes music creation intuitive and exciting.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <SidebarProvider defaultOpen={defaultOpen}>
              <AppSidebar />
              <SidebarInset className="flex flex-col h-screen">
                <header className="bg-background sticky-top z-10 border-b px-4 py-2 flex items-center justify-between gap-2">
                  <div className="flex shrink-0 grow items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                      orientation="vertical"
                      className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadCrumbPageClient />
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                  <div className="flex items-center gap-2">
                    <ModeToggle />
                    <LogoutButton />
                  </div>
                </header>
                <main>{children}</main>
              </SidebarInset>
            </SidebarProvider>{" "}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
