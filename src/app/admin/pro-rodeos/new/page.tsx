import { redirect } from "next/navigation";

export const metadata = {
  title: "Add Pro Rodeo",
};

export default function NewProRodeoAdminPage() {
  redirect("/admin");
}
