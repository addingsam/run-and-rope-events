import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#b45309",
    colorText: "#451a03",
    colorBackground: "#fffaf3",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "shadow-sm border border-amber-200",
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
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
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
