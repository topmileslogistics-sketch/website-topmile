import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Tiny class-name joiner — avoids pulling in a dependency for this. */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
  id,
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "light" | "muted" | "dark";
}) {
  const tones = {
    light: "bg-white text-ink-800",
    muted: "bg-ink-50 text-ink-800",
    dark: "bg-ink-900 text-ink-100",
  } as const;
  return (
    <section id={id} className={cx("py-14 sm:py-20", tones[tone], className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: As = "h2",
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  as?: "h1" | "h2" | "h3";
  align?: "left" | "center";
}) {
  return (
    <div className={cx("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-700">
          {eyebrow}
        </p>
      ) : null}
      <As className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</As>
      {description ? (
        <p className="mt-4 text-lg leading-relaxed opacity-90">{description}</p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  // whitespace-nowrap: a button label should never wrap mid-phrase when a flex
  // parent squeezes it. Buttons size to their content, not the other way round.
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
  secondary:
    "bg-white text-ink-800 ring-1 ring-inset ring-ink-300 hover:bg-ink-50",
  ghost: "text-ink-700 hover:bg-ink-100",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

const buttonSizes: Record<ButtonSize, string> = {
  // 44px min touch target on the two larger sizes.
  sm: "px-3 py-2 text-sm",
  md: "px-5 py-3 text-base min-h-11",
  lg: "px-7 py-4 text-lg min-h-13",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cx(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <Link
      href={href}
      className={cx(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Cards & callouts
// ---------------------------------------------------------------------------

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-xl bg-white p-6 ring-1 ring-ink-200 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/15 backdrop-blur-sm">
      <dt className="text-sm font-medium uppercase tracking-wide text-brand-300">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold text-white sm:text-3xl">{value}</dd>
      {detail ? (
        <dd className="mt-1 text-sm text-ink-200">{detail}</dd>
      ) : null}
    </div>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "error" | "success" | "warning";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: "bg-ink-50 text-ink-800 ring-ink-200",
    error: "bg-red-50 text-red-900 ring-red-200",
    success: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    warning: "bg-amber-50 text-amber-900 ring-amber-200",
  } as const;
  return (
    <div
      className={cx("rounded-lg p-4 ring-1 ring-inset", tones[tone])}
      role={tone === "error" ? "alert" : "status"}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={cx(title && "mt-1", "text-sm leading-relaxed")}>
        {children}
      </div>
    </div>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={cx("h-5 w-5 shrink-0", className)}
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.2 7.3a1 1 0 0 1-1.42.006l-3.8-3.75a1 1 0 1 1 1.404-1.424l3.09 3.05 6.49-6.58a1 1 0 0 1 1.43-.016Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={cx("h-5 w-5 shrink-0", className)}
    >
      <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.6a1.5 1.5 0 0 1 1.46 1.14l.62 2.5a1.5 1.5 0 0 1-.4 1.44l-1 1a11.5 11.5 0 0 0 4.64 4.64l1-1a1.5 1.5 0 0 1 1.44-.4l2.5.62A1.5 1.5 0 0 1 18 13.4V15a1.5 1.5 0 0 1-1.5 1.5h-.5A13.5 13.5 0 0 1 2 4v-.5Z" />
    </svg>
  );
}
