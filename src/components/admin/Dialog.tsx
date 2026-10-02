"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const PANEL =
  "w-[min(440px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-5 text-sm text-text shadow-xl backdrop:bg-black/50";
const CANCEL =
  "cursor-pointer rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-text-nav hover:border-black/20";

/**
 * A modal for the admin's small questions — the ones `window.prompt` and
 * `window.confirm` used to ask.
 *
 * Built on `<dialog>` + `showModal()`: focus trapping, the backdrop and Esc
 * come from the browser rather than hand-rolled key handling. The dialog is
 * always mounted and `open` drives it, so callers keep the state.
 */
export function Dialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Huỷ",
  tone = "default",
  pending = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  /** Disables both buttons while an action is in flight. */
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        // Esc: close ourselves rather than let the browser close the element
        // behind React's back, so `open` and the DOM stay in step.
        event.preventDefault();
        if (!pending) onCancel();
      }}
      onClick={(event) => {
        // Hit-test the panel's own box rather than the event target: the
        // dialog's padding is part of the dialog element, so a click there
        // would otherwise read as a backdrop click and throw the answer away.
        if (pending) return;
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        const { clientX: x, clientY: y } = event;
        if (x < box.left || x > box.right || y < box.top || y > box.bottom) onCancel();
      }}
      className={PANEL}
    >
      <form
        // Prevent the default submit-close: the caller decides when it closes.
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending) onConfirm();
        }}
        className="flex flex-col gap-3"
      >
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {description && (
          <p className="text-sm leading-relaxed text-text-muted">{description}</p>
        )}

        {children}

        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={pending} className={cn(CANCEL, pending && "opacity-50")}>
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "cursor-pointer rounded-lg px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50",
              tone === "danger" ? "bg-red-600" : "bg-primary"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}

/** A dialog that only asks a yes/no question. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone={tone}
      pending={pending}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

/**
 * A dialog that asks for one line of text.
 *
 * The field resets to `defaultValue` every time it opens, so a cancelled
 * edit does not come back the next time it is opened.
 */
export function PromptDialog({
  open,
  title,
  description,
  label,
  defaultValue = "",
  placeholder,
  confirmLabel = "Lưu",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      onConfirm={() => onConfirm(value)}
      onCancel={onCancel}
    >
      <label htmlFor={id} className="text-xs font-semibold text-text-nav">
        {label}
      </label>
      <input
        id={id}
        // The browser focuses the first focusable element in a modal dialog.
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        className="h-10 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm text-text focus:border-accent focus:outline-none"
      />
    </Dialog>
  );
}
