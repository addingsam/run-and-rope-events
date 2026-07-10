import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full bg-stone-100">
      <div className="border-b border-stone-300 bg-stone-900 text-stone-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
              Internal
            </p>
            <p className="text-lg font-bold">Admin</p>
          </div>
          <Link href="/" className="text-sm font-medium text-stone-300 hover:text-white">
            Back to site
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
