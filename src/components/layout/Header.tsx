"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/submit", label: "Submit — free" },
  { href: "/subscribe", label: "Plans" },
];

const headerTextClassName =
  "text-[var(--color-accent-primary)] transition-colors hover:text-[#2a4f66]";

const clerkHeaderAppearance = {
  variables: {
    colorText: "#3D6D8C",
    colorNeutral: "#3D6D8C",
  },
  elements: {
    userButtonTrigger: "text-[#3D6D8C] focus:shadow-none",
    userButtonAvatarBox:
      "border border-[#3D6D8C] ring-0 [&_svg]:text-[#3D6D8C] [&_svg]:fill-[#3D6D8C]",
  },
};

export function Header() {
  return (
    <header className="border-b border-[var(--color-accent-primary)]/20 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className={`text-lg font-bold tracking-tight ${headerTextClassName}`}>
          {APP_NAME}
        </Link>
        <nav className={`flex items-center gap-4 text-sm font-medium sm:gap-6 ${headerTextClassName}`}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={headerTextClassName}>
              {link.label}
            </Link>
          ))}

          <Show when="signed-in">
            <Link href="/dashboard" className={headerTextClassName}>
              Dashboard
            </Link>
            <UserButton appearance={clerkHeaderAppearance} />
          </Show>

          <Show when="signed-out">
            <SignInButton mode="redirect">
              <button type="button" className={headerTextClassName}>
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="redirect" forceRedirectUrl="/subscribe">
              <button
                type="button"
                className={`rounded-full border border-[var(--color-accent-primary)] px-4 py-2 font-semibold text-[var(--color-accent-primary)] transition-colors hover:bg-[var(--color-accent-primary)]/10`}
              >
                Subscribe
              </button>
            </SignUpButton>
          </Show>
        </nav>
      </div>
    </header>
  );
}
