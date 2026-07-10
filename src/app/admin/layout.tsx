import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/require-admin";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminUser();

  return (
    <div className="min-h-full bg-stone-100">
      <div className="border-b border-stone-300 bg-stone-900 text-stone-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
              Internal
            </p>
            <p className="text-lg font-bold">Admin</p>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/admin" className="text-stone-300 hover:text-white">
              Event queue
            </Link>
            <Link href="/admin/pro-rodeos/new" className="text-stone-300 hover:text-white">
              Add pro rodeo
            </Link>
            <Link href="/" className="text-stone-300 hover:text-white">
              Back to site
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
