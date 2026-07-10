import Link from "next/link";
import { ProRodeoAdminForm } from "@/components/admin/ProRodeoAdminForm";

export const metadata = {
  title: "Add Pro Rodeo",
};

export default function NewProRodeoAdminPage() {
  return (
    <div>
      <Link href="/admin" className="text-sm font-semibold text-stone-600 hover:text-stone-900">
        ← Back to admin
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-stone-900">Add Pro Rodeo</h1>
      <p className="mt-3 max-w-2xl text-stone-700">
        Create a WPRA or PRCA listing. On save, the city and state are geocoded to latitude and
        longitude and stored in <code className="text-sm">pro_rodeos</code>.
      </p>
      <div className="mt-8">
        <ProRodeoAdminForm />
      </div>
    </div>
  );
}
