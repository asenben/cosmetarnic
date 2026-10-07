"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

type SelectProps = {
  // Submitted with the surrounding form under this name, like a native <select>. Leave it out for
  // a dropdown that is not a form field.
  name?: string;
  label: string;
  options: readonly Option[];
  defaultValue?: string;
  // Pass both to control the selection from outside instead of letting the dropdown keep it.
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  // Sizing and text alignment of the button, e.g. "h-9 w-44".
  className?: string;
};

// A dropdown styled to match the site; a native <select> can't style its list of options.
export default function Select({
  name,
  label,
  options,
  defaultValue = "",
  value: controlledValue,
  onChange,
  placeholder = "Избери",
  invalid = false,
  className = "",
}: SelectProps) {
  const id = useId();
  const [ownValue, setOwnValue] = useState(defaultValue);
  const value = controlledValue ?? ownValue;
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [activeIndex, setActiveIndex] = useState(0);

  const openList = () => {
    setActiveIndex(Math.max(selectedIndex, 0));
    setOpen(true);
  };

  const select = (index: number) => {
    setOwnValue(options[index].value);
    onChange?.(options[index].value);
    setOpen(false);
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
        if (open) select(activeIndex);
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
      {/* The button shares the field's name so a form can find and focus it; only the hidden input
          after it is submitted, because buttons of type "button" are left out of form data. */}
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
            selectedIndex === -1 ? "font-normal text-brand-ink/40" : "font-semibold text-brand-ink"
          }`}
        >
          {selectedIndex === -1 ? placeholder : options[selectedIndex].label}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-brand-ink/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {name && <input type="hidden" name={name} value={value} />}

      <ul
        id={`${id}-list`}
        role="listbox"
        aria-label={label}
        className={`absolute right-0 z-20 mt-2 max-h-80 min-w-full origin-top-right scrollbar-soft overflow-y-auto rounded-xl border border-black/5 bg-white p-1 shadow-lg shadow-brand-ink/10 transition duration-150 ease-out motion-reduce:transition-none ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {options.map((option, index) => {
          const selected = index === selectedIndex;
          return (
            <li
              key={option.value}
              id={`${id}-${index}`}
              role="option"
              aria-selected={selected}
              // Keep focus on the button so its blur doesn't close the list before the click lands.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => select(index)}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
                selected ? "font-semibold text-brand-rose" : "text-brand-ink"
              } ${index === activeIndex ? "bg-brand-rose/10" : ""}`}
            >
              {option.label}
              <Check className={`size-4 ${selected ? "" : "invisible"}`} aria-hidden />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
