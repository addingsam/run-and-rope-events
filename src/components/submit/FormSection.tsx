import { themeMutedTextClassName, themePanelClassName } from "@/lib/theme/form-classes";

interface FormSectionProps {
  title: string;
  description?: string;
  titleClassName?: string;
  children: React.ReactNode;
}

export function FormSection({
  title,
  description,
  titleClassName = "text-[var(--color-text-primary)]",
  children,
}: FormSectionProps) {
  return (
    <section className={`shadow-sm ${themePanelClassName}`}>
      <div className="rounded-t-2xl border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 sm:px-6">
        <h2 className={`text-base font-bold tracking-wide sm:text-lg ${titleClassName}`}>{title}</h2>
        {description && <p className={`mt-1 leading-6 ${themeMutedTextClassName}`}>{description}</p>}
      </div>
      <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}
