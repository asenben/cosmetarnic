import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import FavoritesProvider from "@/components/FavoritesProvider";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import Navigation from "@/components/Navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getFavoriteIds } from "@/lib/listings/favorites";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = "Козметарник";

// The browser tab reads "<page> | <username>" for someone signed in, and "<page> | Козметарник"
// for a visitor. Pages that set no title of their own show just the second part.
export async function generateMetadata(): Promise<Metadata> {
  const owner = (await getCurrentUser())?.username ?? SITE_NAME;
  return {
    title: { default: owner, template: `%s | ${owner}` },
    description: "Платформа за козметиката. Купувай и продавай продукти.",
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const favoriteIds = user ? await getFavoriteIds(user.id) : [];

  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider initialUser={user}>
          <FavoritesProvider initialIds={favoriteIds}>
            <Navigation />
            {children}
            <Footer />
            <MobileTabBar />
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
