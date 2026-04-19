"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options: SelectOption[];
  label?: string;
  error?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, label, error, placeholder, onChange, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "flex h-11 w-full font-sans appearance-none rounded-lg border bg-white px-4 py-2 pr-10 text-sm shadow-sm transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50",
              "dark:bg-neutral-800 dark:border-neutral-700 dark:text-white",
              error
                ? "border-error focus:ring-error"
                : "border-neutral-200 dark:border-neutral-700",
              className
            )}
            onChange={(e) => onChange?.(e.target.value)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
