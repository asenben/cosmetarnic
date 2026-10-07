import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ChevronDown, CircleHelp, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Често задавани въпроси",
};

const steps = [
  {
    title: "Изберете продукт",
    text: "Разгледайте наличните обяви и изберете продукта, който представлява интерес за вас. В обявата ще откриете информация за продукта, състоянието му, цената и условията, посочени от продавача.",
  },
  {
    title: "Свържете се с продавача",
    text: "Използвайте функцията за съобщения, за да се свържете директно с продавача. При необходимост можете да зададете допълнителни въпроси относно продукта.",
  },
  {
    title: "Уточнете условията на сделката",
    text: "Купувачът и продавачът самостоятелно договарят всички детайли по сделката.",
  },
  {
    title: "Получете продукта",
    text: "След като постигнете договореност, продавачът изпраща продукта по избрания начин или го предава лично, съгласно уговореното между двете страни.",
  },
];

const dealDetails = [
  "предпочитан начин на получаване – лично предаване или доставка с куриер;",
  "при куриерска доставка – предпочитаната куриерска компания, както и офис или адрес за получаване;",
  "начин и условия на плащане;",
  "цена и условия за доставка;",
  "всички останали детайли, свързани със сделката.",
];

type QuestionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

function Question({ id, title, children }: QuestionProps) {
  return (
    <details id={id} open className="group scroll-mt-6 border-t border-black/10 last:border-b">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-5 text-xl font-bold text-brand-ink transition-colors hover:text-brand-rose [&::-webkit-details-marker]:hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
          <CircleHelp className="size-5" aria-hidden />
        </span>
        <h2 className="flex-1">{title}</h2>
        <ChevronDown
          className="size-5 shrink-0 text-brand-rose transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="pb-8">{children}</div>
    </details>
  );
}

export default function FaqPage() {
  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article className="text-base leading-7 text-brand-ink/80">
          <h1 className="sr-only">Често задавани въпроси</h1>

          <div>
            <Question id="how-to-order" title="Как да поръчам?">
              <p className="text-brand-ink/60">
                Пазаруването в платформата е лесно и се извършва директно между купувача и продавача.
              </p>

              <ol className="mt-6 space-y-6">
                {steps.map(({ title, text }, index) => (
                  <li key={title} className="flex gap-4">
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-rose text-sm font-bold text-white"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-brand-ink">
                        <span className="sr-only">{index + 1}. </span>
                        {title}
                      </h3>
                      <p className="mt-1">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <aside className="mt-8 flex gap-3 rounded-2xl bg-brand-rose/10 p-5">
                <Info className="mt-1 size-5 shrink-0 text-brand-rose" aria-hidden />
                <div>
                  <h3 className="font-bold text-brand-ink">Важно</h3>
                  <p className="mt-1">
                    Платформата предоставя място за публикуване и откриване на обяви и улеснява комуникацията между
                    потребителите. Тя не е страна по сделката и не участва в договарянето, плащането или доставката.
                    Всички условия и отговорности по покупко-продажбата се уточняват директно между купувача и
                    продавача.
                  </p>
                </div>
              </aside>
            </Question>

            <Question id="delivery" title="Доставка и плащане">
              <p>
                Платформата служи за обединяване и представяне на обяви за козметични продукти и улесняване на
                контакта между купувачи и продавачи. Самата сделка, включително условията за доставка и плащане, се
                договаря директно между страните.
              </p>
              <p className="mt-4">
                Комуникацията между купувача и продавача се осъществява чрез функцията за съобщения в платформата. В
                рамките на разговора страните могат да уточнят:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-brand-rose">
                {dealDetails.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>

              <h3 className="mt-8 text-lg font-bold text-brand-ink">Отговорност за сделката</h3>
              <p className="mt-2">
                Платформата не е страна по сделката и не участва в договарянето, плащането или организирането на
                доставката. Тя не определя условията между купувача и продавача и не носи отговорност за
                изпълнението на договореностите между тях.
              </p>
              <p className="mt-4">
                Всички условия по покупката, включително цената, начина на плащане, доставката и предаването на
                продукта, се договарят и приемат самостоятелно от купувача и продавача.
              </p>
            </Question>
          </div>
        </article>
      </div>
    </main>
  );
}
