import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <article>
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-brand-ink sm:text-3xl">Политика за поверителност</h1>

          <div className="mt-6 space-y-5 text-base leading-7 text-brand-ink/80">
            <p>
              Личните данни се обработват само доколкото са необходими за създаване и управление на профил,
              публикуване на обяви, комуникация между потребители и сигурност на платформата.
            </p>
            <p>
              Данните не се продават. Пазим ги съгласно приложимото законодателство и регламента за защита на
              личните данни (ЗЗЛД).
            </p>
            <p>
              При въпроси относно личните ви данни можете да се свържете с нас чрез{" "}
              <Link
                href="/contact"
                className="font-semibold text-brand-rose underline-offset-4 transition-colors hover:text-brand hover:underline"
              >
                страницата за контакт
              </Link>
              .
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
