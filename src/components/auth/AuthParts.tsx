"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { FaFacebook } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";

const socialButton =
  "flex h-10 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-black/10 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-rose/50 hover:bg-zinc-50";

export const submitButton =
  "h-10 w-full cursor-pointer rounded-xl bg-brand-rose text-sm font-semibold text-white transition-colors hover:bg-brand";

export const textLink =
  "cursor-pointer font-semibold text-brand-rose underline-offset-4 transition-colors hover:text-brand hover:underline";

export function AuthHeader({ title }: { title: string }) {
  return (
    <h2 className="px-10 text-center text-3xl font-bold tracking-wide text-brand-pastel uppercase">{title}</h2>
  );
}

type AuthFieldProps = ComponentProps<"input"> & {
  label: string;
  icon: LucideIcon;
  // Shown above the field on the right, e.g. a "forgot password" link.
  action?: ReactNode;
};

export function AuthField({ label, icon: Icon, action, type = "text", ...input }: AuthFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      {/* The placeholder names the field visually; the label stays for screen readers. */}
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
          required
          placeholder={label}
          {...input}
          className={`h-10 w-full rounded-xl border border-black/10 bg-white pl-10 text-sm text-brand-ink transition-colors outline-none placeholder:text-brand-ink/40 focus:border-brand-rose ${
            isPassword ? "pr-11" : "pr-4"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={visible ? "Скрий паролата" : "Покажи паролата"}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
            className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-brand-ink/50 transition-colors hover:text-brand-rose"
          >
            {visible ? <EyeOff className="size-4.5" aria-hidden /> : <Eye className="size-4.5" aria-hidden />}
          </button>
        )}
      </div>
    </div>
  );
}

export function SocialLogin() {
  return (
    <>
      <div className="my-3 flex items-center gap-4 text-xs text-brand-ink/50">
        <span className="h-px flex-1 bg-black/10" aria-hidden />
        или
        <span className="h-px flex-1 bg-black/10" aria-hidden />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={socialButton}>
          <FcGoogle className="size-5" aria-hidden />
          Google
        </button>
        <button type="button" className={socialButton}>
          <FaFacebook className="size-5 text-facebook" aria-hidden />
          Facebook
        </button>
      </div>
    </>
  );
}

type AuthSwitchProps = {
  question: string;
  action: string;
  onClick?: () => void;
};

export function AuthSwitch({ question, action, onClick }: AuthSwitchProps) {
  return (
    <p className="mt-3 text-center text-sm text-brand-ink/70">
      {question}{" "}
      <button type="button" onClick={onClick} className={textLink}>
        {action}
      </button>
    </p>
  );
}
