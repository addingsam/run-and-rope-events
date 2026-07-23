"use client";

import { DateInput } from "@/components/submit/DateInput";

interface OptionalDateInputProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  addLabel?: string;
}

export function OptionalDateInput(props: OptionalDateInputProps) {
  return <DateInput {...props} clearable alwaysShowClear />;
}
