"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/submit", label: "Submit" },
  { href: "/subscribe", label: "Plans" },
];

export function Header() {
  return (
    <header className="border-b border-amber-200/60 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-amber-950">
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-amber-900/80 sm:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-amber-950"
            >
              {link.label}
            </Link>
          ))}

          <Show when="signed-in">
            <Link href="/dashboard" className="transition-colors hover:text-amber-950">
              Dashboard
            </Link>
            <UserButton />
          </Show>

          <Show when="signed-out">
            <SignInButton mode="redirect">
              <button
                type="button"
                className="transition-colors hover:text-amber-950"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="redirect" forceRedirectUrl="/subscribe">
              <button
                type="button"
                className="rounded-full bg-amber-700 px-4 py-2 text-white transition-colors hover:bg-amber-800"
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
