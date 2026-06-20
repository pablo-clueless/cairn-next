"use client";

import { ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";
import * as React from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Option = {
  label: string;
  value: string;
};

interface Props {
  onChange: (value: string[]) => void;
  options: Option[];
  className?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  labelClassName?: string;
  maxSelectable?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  value?: string[];
  wrapperClassName?: string;
}

export const MultiSelect = ({
  className,
  disabled,
  error,
  label,
  labelClassName,
  maxSelectable,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  required,
  value = [],
  wrapperClassName,
}: Props) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleValueChange = React.useCallback(
    (optionValue: string) => {
      const isSelected = value.includes(optionValue);

      if (isSelected) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        if (maxSelectable && value.length >= maxSelectable) {
          toast.info(
            `Maximum ${maxSelectable} selection${maxSelectable !== 1 ? "s" : ""} allowed.`,
          );
          return;
        }
        onChange([...value, optionValue]);
      }
      inputRef.current?.focus();
    },
    [maxSelectable, onChange, value],
  );

  const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label);
  const hasError = !!error;

  return (
    <div className={cn("w-full space-y-0.5", wrapperClassName)}>
      {label && (
        <p
          className={cn(
            "text-sm font-medium text-gray-700",
            labelClassName,
            required && "after:ml-1 after:text-red-500 after:content-['*']",
          )}
        >
          {label}
        </p>
      )}
      <Popover>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            className={cn(
              "mt-1 flex h-9 w-full items-center justify-between rounded-xs border bg-transparent px-3 text-sm text-gray-900 capitalize transition-all focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:truncate",
              hasError ? "border-red-500" : "border-input",
              className,
            )}
            data-placeholder={value.length === 0}
            type="button"
          >
            <span className={value.length === 0 ? "text-muted-foreground" : undefined}>
              {selectedLabels.length > 0
                ? selectedLabels.join(", ")
                : (placeholder ?? "Select values...")}
            </span>
            <ChevronDownIcon className="shrink-0 text-gray-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0" style={{ width: "var(--radix-popper-anchor-width)" }}>
          <Command loop className="min-w-fit">
            <CommandInput ref={inputRef} placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty className="text-center text-xs text-gray-400">
                No results found.
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const selected = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      data-checked={selected}
                      className="group cursor-pointer"
                      onSelect={() => handleValueChange(option.value)}
                    >
                      <span className="flex-1 text-sm capitalize">{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
