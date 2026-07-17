"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/constants";
import { clerkHeaderAppearance } from "@/lib/clerk/appearance";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/submit", label: "Submit — free", mobileLabel: "Submit" },
  { href: "/subscribe", label: "Plans" },
  { href: "/contact", label: "Contact" },
];

const headerTextClassName =
  "text-[var(--color-accent-primary)] transition-colors hover:text-[#2a4f66]";

const mobileNavLinkClassName =
  "block rounded-lg px-3 py-2.5 text-base font-medium text-[var(--color-accent-primary)] transition-colors hover:bg-[var(--color-accent-primary)]/10";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
      className="h-6 w-6"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="border-b border-[var(--color-accent-primary)]/20 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className={`min-w-0 shrink text-base font-bold leading-tight tracking-tight sm:text-lg ${headerTextClassName}`}
        >
          <span className="md:hidden">J&amp;R Events</span>
          <span className="hidden md:inline">{APP_NAME}</span>
        </Link>

        <nav
          className={`hidden items-center gap-4 text-sm font-medium md:flex md:gap-6 ${headerTextClassName}`}
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={headerTextClassName}>
              {link.label}
            </Link>
          ))}

          <Show when="signed-in">
            <Link href="/dashboard" className={headerTextClassName}>
              Profile
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

        <div className="flex items-center gap-2 md:hidden">
          <Show when="signed-in">
            <UserButton appearance={clerkHeaderAppearance} />
          </Show>
          <button
            type="button"
            className={`rounded-lg p-2 ${headerTextClassName}`}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-nav"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <MenuIcon open={mobileMenuOpen} />
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav
          id="mobile-site-nav"
          className="border-t border-[var(--color-accent-primary)]/15 px-4 py-3 md:hidden"
        >
          <ul className="space-y-1">
            <li>
              <Link href="/" className={mobileNavLinkClassName} onClick={closeMobileMenu}>
                Home
              </Link>
            </li>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={mobileNavLinkClassName} onClick={closeMobileMenu}>
                  {link.mobileLabel ?? link.label}
                </Link>
              </li>
            ))}
            <li>
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  className={mobileNavLinkClassName}
                  onClick={closeMobileMenu}
                >
                  Profile
                </Link>
              </Show>
            </li>
          </ul>

          <Show when="signed-out">
            <div className="mt-3 space-y-2 border-t border-[var(--color-accent-primary)]/15 pt-3">
              <SignInButton mode="redirect">
                <button
                  type="button"
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-base font-medium ${headerTextClassName}`}
                  onClick={closeMobileMenu}
                >
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="redirect" forceRedirectUrl="/subscribe">
                <button
                  type="button"
                  className="w-full rounded-full bg-[var(--color-accent-cta)] px-4 py-2.5 text-base font-semibold text-[var(--color-background)] transition-colors hover:opacity-90"
                  onClick={closeMobileMenu}
                >
                  Subscribe
                </button>
              </SignUpButton>
            </div>
          </Show>
        </nav>
      ) : null}
    </header>
  );
}
