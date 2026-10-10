"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

type MultiSelectProps = {
  // Every chosen value is submitted with the surrounding form under this name.
  name: string;
  label: string;
  options: readonly Option[];
  defaultValue?: string[];
  placeholder?: string;
  invalid?: boolean;
  // Sizing of the button, e.g. "h-9 w-44".
  className?: string;
};

// A dropdown like Select, where each option has a checkbox and any number of them can be chosen.
// The list stays open while options are ticked.
export default function MultiSelect({
  name,
  label,
  options,
  defaultValue = [],
  placeholder = "Избери",
  invalid = false,
  className = "",
}: MultiSelectProps) {
  const id = useId();
  const [values, setValues] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // In the order of the options, whatever the order they were ticked in.
  const chosen = options.filter((option) => values.includes(option.value));

  const openList = () => {
    setActiveIndex(Math.max(options.findIndex((option) => values.includes(option.value)), 0));
    setOpen(true);
  };

  const toggle = (index: number) => {
    const { value } = options[index];
    setValues(values.includes(value) ? values.filter((other) => other !== value) : [...values, value]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) return openList();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((index) => Math.min(last, Math.max(0, index + step)));
        break;
      }
      case "Home":
      case "End":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(event.key === "Home" ? 0 : last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) toggle(activeIndex);
        else openList();
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  return (
    <div className="relative">
      {/* The button shares the field's name so a form can find and focus it; only the hidden inputs
          after it are submitted, because buttons of type "button" are left out of form data. */}
      <button
        type="button"
        name={name}
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${activeIndex}` : undefined}
        aria-invalid={invalid}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white pr-2.5 pl-3 text-sm transition-colors outline-none focus-visible:border-brand-rose aria-invalid:border-red-500 ${
          open ? "border-brand-rose" : "border-black/10 hover:border-brand-rose/50"
        } ${className}`}
      >
        <span
          className={`min-w-0 truncate ${
            chosen.length === 0 ? "font-normal text-brand-ink/40" : "font-semibold text-brand-ink"
          }`}
        >
          {chosen.length === 0 ? placeholder : chosen.map((option) => option.label).join(", ")}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-brand-ink/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {chosen.map((option) => (
        <input key={option.value} type="hidden" name={name} value={option.value} />
      ))}

      <ul
        id={`${id}-list`}
        role="listbox"
        aria-label={label}
        aria-multiselectable
        className={`absolute right-0 z-20 mt-2 max-h-80 min-w-full origin-top-right scrollbar-soft overflow-y-auto rounded-xl border border-black/5 bg-white p-1 shadow-lg shadow-brand-ink/10 transition duration-150 ease-out motion-reduce:transition-none ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {options.map((option, index) => {
          const selected = values.includes(option.value);
          return (
            <li
              key={option.value}
              id={`${id}-${index}`}
              role="option"
              aria-selected={selected}
              // Keep focus on the button so its blur doesn't close the list before the click lands.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => toggle(index)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
                selected ? "font-semibold text-brand-rose" : "text-brand-ink"
              } ${index === activeIndex ? "bg-brand-rose/10" : ""}`}
            >
              <span
                aria-hidden
                className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  selected ? "border-brand-rose bg-brand-rose text-white" : "border-black/20 bg-white"
                }`}
              >
                <Check className={`size-3 ${selected ? "" : "invisible"}`} strokeWidth={3} />
              </span>
              {option.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}