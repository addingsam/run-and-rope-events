import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SavedEventsProvider } from "@/components/saved/SavedEventsProvider";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { getAuthUserProfile } from "@/lib/auth/get-user";
import { getIsSubscriber } from "@/lib/subscription/status";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#3D6D8C",
    colorText: "#F2F1ED",
    colorBackground: "#16181C",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "shadow-sm border border-[var(--color-border)]",
    formButtonPrimary: "bg-amber-700 hover:bg-amber-800",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getAuthUserProfile();
  const isSubscriber = await getIsSubscriber();
  const savedEventsEnabled = Boolean(profile && isSubscriber);

  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/events"
      signUpFallbackRedirectUrl="/subscribe"
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-text-primary)]">
          <SavedEventsProvider enabled={savedEventsEnabled}>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </SavedEventsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
