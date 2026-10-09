"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

export const submitButton =
  "h-10 w-full cursor-pointer rounded-xl bg-brand-rose text-sm font-semibold text-white transition-colors hover:bg-brand";

export const textLink =
  "cursor-pointer font-semibold text-brand-rose underline underline-offset-4 transition-colors hover:text-brand";

export function AuthHeader({ title }: { title: string }) {
  return (
    <h2 className="px-10 text-center text-2xl font-normal tracking-[0.12em] text-brand-rose uppercase">{title}</h2>
  );
}

type AuthFieldProps = ComponentProps<"input"> & {
  label: string;
  icon: LucideIcon;
  // Shown above the field on the right, e.g. a "forgot password" link.
  action?: ReactNode;
};

export function AuthField({
  label,
  icon: Icon,
  action,
  type = "text",
  required = true,
  placeholder = label,
  ...input
}: AuthFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      {/* The placeholder text names the field visually; the label stays for screen readers. */}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {action && <div className="mb-1 flex justify-end">{action}</div>}
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-brand-rose"
          aria-hidden
        />
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          required={required}
          // A blank native placeholder only drives :placeholder-shown; the visible one is the span
          // below, because a native placeholder cannot colour the asterisk separately.
          placeholder=" "
          {...input}
          className={`peer h-9 w-full rounded-xl border border-black/10 bg-white pl-10 text-sm text-brand-ink transition-colors outline-none focus:border-brand-rose ${
            isPassword ? "pr-11" : "pr-4"
          }`}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute top-1/2 left-10 hidden -translate-y-1/2 truncate text-sm text-brand-ink/40 peer-placeholder-shown:block ${
            isPassword ? "right-11" : "right-4"
          }`}
        >
          {placeholder}
          {required && <span className="text-red-600"> *</span>}
        </span>
        {isPassword && (
          <button
            type="button"
            aria-label={visible ? "Скрий паролата" : "Покажи паролата"}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
            className="absolute top-1/2 right-0.5 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-brand-ink/50 transition-colors hover:text-brand-rose"
          >
            {visible ? <EyeOff className="size-4.5" aria-hidden /> : <Eye className="size-4.5" aria-hidden />}
          </button>
        )}
      </div>
    </div>
  );
}

type AuthSwitchProps = {
  question: string;
  action: string;
  onClick?: () => void;
};

export function AuthSwitch({ question, action, onClick }: AuthSwitchProps) {
  return (
    <p className="mt-6 text-center text-sm text-brand-ink/70">
      {question}{" "}
      <button type="button" onClick={onClick} className={textLink}>
        {action}
      </button>
    </p>
  );
}
