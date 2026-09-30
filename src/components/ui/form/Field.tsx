"use client";

import { forwardRef, useId, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { describedBy } from "@/components/ui/form/describedBy";

/** Attributes a control needs to be wired to its label, hint and error. */
export type FieldControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
};

// 16px on phones stops iOS zooming into the field; 14px from `md` up.
const CONTROL =
  "block w-full rounded-xl border border-field bg-white px-3.5 text-base text-text transition-[border-color,box-shadow,background-color] duration-fast ease-standard placeholder:text-[#6E6E6E] hover:border-field-hover focus:border-accent focus:shadow-field-focus focus:outline-none md:text-sm aria-[invalid=true]:border-err-border aria-[invalid=true]:shadow-[inset_0_0_0_1px_#D92D20] aria-[invalid=true]:focus:shadow-[inset_0_0_0_1px_#D92D20,0_0_0_2px_#fff,0_0_0_4px_#314344] disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-disabled read-only:cursor-not-allowed read-only:border-border read-only:bg-surface-muted read-only:text-disabled";

// forwardRef so a form can focus the first invalid control.
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input {...props} ref={ref} className={cn(CONTROL, "h-11", className)} />;
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      {...props}
      ref={ref}
      className={cn(CONTROL, "min-h-[120px] resize-y py-3 leading-[1.55]", className)}
    />
  );
});

/**
 * Label, control, hint and error as one unit. `children` receives the props that
 * connect the control to them (`id`, `aria-describedby`, `aria-invalid`), so the
 * label is a real `<label for>` and never a placeholder.
 */
export function Field({
  label,
  hint,
  error,
  optionalNote,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  /** Muted text after the label, e.g. "(không bắt buộc)". */
  optionalNote?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}) {
  const uid = useId();
  const id = `${uid}-control`;
  const hintId = hint ? `${uid}-hint` : undefined;
  const errorId = error ? `${uid}-error` : undefined;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold leading-[1.4] text-primary">
        {label}
        {optionalNote && (
          <span className="ml-1 font-normal text-text-muted">{optionalNote}</span>
        )}
      </label>
      {children({
        id,
        "aria-describedby": describedBy({ hint: hintId, error: errorId }),
        "aria-invalid": error ? true : undefined,
      })}
      {hint && (
        <p id={hintId} className="text-[13px] leading-[1.45] text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-[13px] font-medium leading-[1.45] text-err"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
