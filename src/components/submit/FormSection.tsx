interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="rounded-2xl border border-amber-200/80 bg-white shadow-sm">
      <div className="rounded-t-2xl border-b border-amber-200/60 bg-amber-100/70 px-4 py-4 sm:px-6">
        <h2 className="text-base font-bold tracking-wide text-amber-950 sm:text-lg">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-amber-900/70">{description}</p>
        )}
      </div>
      <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}
