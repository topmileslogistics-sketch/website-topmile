"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { cx } from "@/components/ui";

/**
 * Accessible form primitives.
 *
 * Each control wires up label → input, and error → input via aria-describedby
 * + aria-invalid, so a screen reader announces the problem with the field
 * rather than leaving the user to hunt for red text.
 */

const controlBase =
  "block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-ink-900 ring-1 ring-inset ring-ink-300 placeholder:text-ink-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 disabled:bg-ink-100 disabled:text-ink-500";

const controlError = "ring-red-500 focus:ring-red-600";

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-ink-800"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1 font-normal text-ink-500">(optional)</span>
        )}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

/* -------------------------------------------------------------------------- */

export type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "date" | "number" | "password";
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  min?: string | number;
  max?: string | number;
  maxLength?: number;
  className?: string;
  name?: string;
};

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  hint,
  error,
  required,
  placeholder,
  autoComplete,
  inputMode,
  min,
  max,
  maxLength,
  className,
  name,
}: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(controlBase, error && controlError)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        max={max}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={required || undefined}
      />
    </FieldShell>
  );
}

/* -------------------------------------------------------------------------- */

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  error,
  required,
  placeholder = "Select…",
  autoComplete,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<readonly [string, string]> | ReadonlyArray<string>;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}) {
  const id = useId();
  const normalized: Array<readonly [string, string]> = options.map((o) =>
    typeof o === "string" ? ([o, o] as const) : o,
  );

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(controlBase, error && controlError)}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={required || undefined}
      >
        <option value="">{placeholder}</option>
        {normalized.map(([val, text]) => (
          <option key={val} value={val}>
            {text}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/* -------------------------------------------------------------------------- */

export function TextareaField({
  label,
  value,
  onChange,
  hint,
  error,
  required,
  rows = 4,
  maxLength,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cx(controlBase, error && controlError)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={required || undefined}
      />
    </FieldShell>
  );
}

/* -------------------------------------------------------------------------- */

export function CheckboxField({
  label,
  checked,
  onChange,
  hint,
  error,
  className,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  error?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={cx(
            "mt-0.5 h-5 w-5 shrink-0 rounded border-ink-400 text-brand-600 focus:ring-brand-600",
            error && "border-red-500",
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
        />
        <label htmlFor={id} className="text-sm leading-relaxed text-ink-800">
          {label}
        </label>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="ml-8 mt-1 text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="ml-8 mt-1 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Yes/No radio pair — clearer than a lone checkbox for record questions. */
export function YesNoField({
  label,
  value,
  onChange,
  hint,
  error,
  className,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
  error?: string;
  className?: string;
}) {
  const name = useId();
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;

  return (
    <fieldset className={className}>
      <legend className="text-sm font-semibold text-ink-800">{label}</legend>
      {hint ? (
        <p id={hintId} className="mt-1 text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
      <div
        className="mt-2 flex gap-3"
        aria-describedby={describedBy(name, hint, error)}
      >
        {[
          { label: "Yes", val: true },
          { label: "No", val: false },
        ].map((option) => (
          <label
            key={option.label}
            className={cx(
              "flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ring-1 ring-inset transition-colors sm:flex-none sm:min-w-24",
              value === option.val
                ? "bg-brand-600 text-white ring-brand-600"
                : "bg-white text-ink-700 ring-ink-300 hover:bg-ink-50",
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === option.val}
              onChange={() => onChange(option.val)}
            />
            {option.label}
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/* -------------------------------------------------------------------------- */

export function CheckboxGroup({
  legend,
  options,
  values,
  onChange,
  hint,
  error,
  columns = 2,
}: {
  legend: string;
  options: ReadonlyArray<string>;
  values: string[];
  onChange: (values: string[]) => void;
  hint?: string;
  error?: string;
  columns?: 1 | 2 | 3;
}) {
  const id = useId();
  const toggle = (option: string) => {
    onChange(
      values.includes(option)
        ? values.filter((v) => v !== option)
        : [...values, option],
    );
  };

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink-800">{legend}</legend>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
      <div
        className={cx(
          "mt-2 grid gap-2",
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-1 sm:grid-cols-2",
          columns === 3 && "grid-cols-1 sm:grid-cols-3",
        )}
      >
        {options.map((option) => {
          const checked = values.includes(option);
          return (
            <label
              key={option}
              className={cx(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium ring-1 ring-inset transition-colors",
                checked
                  ? "bg-brand-50 text-ink-900 ring-brand-500"
                  : "bg-white text-ink-700 ring-ink-300 hover:bg-ink-50",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(option)}
                className="h-5 w-5 rounded border-ink-400 text-brand-600 focus:ring-brand-600"
              />
              {option}
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/* -------------------------------------------------------------------------- */

export function FieldGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("grid gap-5 sm:grid-cols-2", className)}>{children}</div>
  );
}

export function RepeaterCard({
  title,
  onRemove,
  removeLabel,
  children,
}: {
  title: string;
  onRemove?: () => void;
  removeLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-ink-50 p-5 ring-1 ring-ink-200">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h4 className="font-semibold text-ink-900">{title}</h4>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            {removeLabel}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
