import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-amber-200/60 bg-amber-950 text-amber-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">{APP_NAME}</p>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link
            href="/contact"
            className="text-sm text-amber-100 transition-colors hover:text-white"
          >
            Contact us
          </Link>
          <p className="text-sm text-amber-200/80">{APP_TAGLINE}</p>
        </div>
      </div>
    </footer>
  );
}
