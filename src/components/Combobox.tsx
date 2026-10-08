"use client";

import { useId, useState, type KeyboardEvent } from "react";

type ComboboxProps = {
  // Submitted with the surrounding form under this name, like any text input.
  name: string;
  label: string;
  // Suggestions shown while typing; any other text can still be entered.
  options: readonly string[];
  // The text the field starts with.
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
  invalid?: boolean;
  // Classes for the text input itself.
  className?: string;
};

// A text input with a list of suggestions styled to match the site, in place of a native <datalist>.
// Renders the input and the list side by side: put it inside a `relative` wrapper.
export default function Combobox({
  name,
  label,
  options,
  defaultValue = "",
  placeholder,
  maxLength,
  invalid = false,
  className = "",
}: ComboboxProps) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  // -1 while nothing is highlighted, so Enter still submits the form until a suggestion is chosen.
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = value.trim().toLowerCase();
  const matches = options.filter((option) => option.toLowerCase().includes(query));
  // Nothing to suggest once the text is exactly one of the options.
  const suggestions = matches.length === 1 && matches[0].toLowerCase() === query ? [] : matches;
  const listOpen = open && suggestions.length > 0;

  const choose = (option: string) => {
    setValue(option);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const last = suggestions.length - 1;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        if (last < 0) return;
        event.preventDefault();
        setOpen(true);
        setActiveIndex((index) => {
          if (event.key === "ArrowDown") return index >= last ? 0 : index + 1;
          return index <= 0 ? last : index - 1;
        });
        break;
      case "Enter":
        if (listOpen && activeIndex >= 0) {
          event.preventDefault();
          choose(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        if (listOpen) {
          event.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  return (
    <>
      <input
        name={name}
        value={value}
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={listOpen}
        aria-controls={`${id}-list`}
        aria-activedescendant={listOpen && activeIndex >= 0 ? `${id}-${activeIndex}` : undefined}
        aria-invalid={invalid}
        autoComplete="off"
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={className}
      />

      <ul
        id={`${id}-list`}
        role="listbox"
        aria-label={label}
        className={`absolute inset-x-0 top-full z-20 mt-2 max-h-56 origin-top scrollbar-soft overflow-y-auto rounded-xl border border-black/5 bg-white p-1 shadow-lg shadow-brand-ink/10 transition duration-150 ease-out motion-reduce:transition-none ${
          listOpen ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {suggestions.map((option, index) => (
          <li
            key={option}
            id={`${id}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            // Keep focus on the input so its blur doesn't close the list before the click lands.
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => choose(option)}
            className={`cursor-pointer rounded-lg px-3 py-2 text-sm text-brand-ink ${
              index === activeIndex ? "bg-brand-rose/10" : ""
            }`}
          >
            {option}
          </li>
        ))}
      </ul>
    </>
  );
}
