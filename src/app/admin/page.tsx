import Link from "next/link";

export const metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">Admin panel</h1>
      <p className="mt-3 max-w-2xl text-stone-700">
        Internal tools for managing Run &amp; Rope Events. More sections will be added here as
        the admin panel grows.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/pro-rodeos/new"
          className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-stone-900">Add Pro Rodeo</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Manually add a WPRA or PRCA listing with official external link and geocoded
            location.
          </p>
        </Link>
      </div>
    </div>
  );
}
