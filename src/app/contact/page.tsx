import { currentUser } from "@clerk/nextjs/server";
import { ContactForm } from "@/components/contact/ContactForm";
import { getAuthUserProfile } from "@/lib/auth/get-user";
import { themeMutedTextClassName } from "@/lib/theme/form-classes";

export const metadata = {
  title: "Contact",
};

export default async function ContactPage() {
  const profile = await getAuthUserProfile();
  const user = profile ? await currentUser() : null;
  const defaultName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <div className="bg-[var(--background)]">
      <div className="border-b border-[var(--color-border)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--background)]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-primary)]">
            Get in touch
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Contact the team
          </h1>
          <p className={`mt-4 max-w-2xl ${themeMutedTextClassName}`}>
            Questions about listings, subscriptions, saved searches, or anything else on the site?
            Send a message and we&apos;ll get back to you by email.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <ContactForm
          defaultName={defaultName}
          defaultEmail={profile?.email ?? ""}
          lockEmail={Boolean(profile?.email)}
        />
      </div>
    </div>
  );
}
