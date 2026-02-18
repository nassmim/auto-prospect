"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

type DropdownOption = {
  value: string;
  label: string;
  color?: string;
  icon?: ReactNode;
};

type DropdownProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  options: DropdownOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  allowNull?: boolean;
  nullLabel?: string;
};

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  label,
  disabled = false,
  allowNull = false,
  nullLabel = "Aucun",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string | null) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="mb-2 block text-sm font-medium text-zinc-400">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-left transition-colors ${
          disabled
            ? "cursor-not-allowed border-zinc-800 bg-zinc-900/50 text-zinc-600"
            : "cursor-pointer border-zinc-800 bg-zinc-900/50 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900"
        } ${isOpen ? "border-amber-500/50 ring-2 ring-amber-500/20" : ""}`}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}
          {selectedOption?.color && (
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span className={selectedOption ? "text-zinc-200" : "text-zinc-500"}>
            {selectedOption?.label || placeholder}
          </span>
        </div>

        <svg
          className={`h-4 w-4 flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          } ${disabled ? "text-zinc-600" : "text-zinc-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl">
          <div className="max-h-64 overflow-y-auto">
            {allowNull && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-zinc-800"
              >
                <span className="text-zinc-400">{nullLabel}</span>
              </button>
            )}

            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-zinc-800 ${
                  value === option.value ? "bg-zinc-800/50" : ""
                }`}
              >
                {option.icon && (
                  <span className="flex-shrink-0">{option.icon}</span>
                )}
                {option.color && (
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span className="text-zinc-200">{option.label}</span>
                {value === option.value && (
                  <svg
                    className="ml-auto h-4 w-4 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
