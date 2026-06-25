"use client";

import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar, type DateRange } from "./calendar";
import { cn } from "@/lib/utils";
import { FocusEventHandler } from "react";

type SingleDatePickerProps = {
  onValueChange: (date: Date | undefined) => void;
  type: "single";
  value: Date | undefined;
  className?: string;
  disabled?: boolean;
  disabledDates?: Date[];
  error?: boolean;
  label?: string;
  labelClassName?: string;
  maxDate?: Date;
  minDate?: Date;
  onBlur?: FocusEventHandler;
  placeholder?: string;
};

type RangeDatePickerProps = {
  onValueChange: (range: DateRange) => void;
  type: "range";
  value: DateRange;
  className?: string;
  disabled?: boolean;
  disabledDates?: Date[];
  error?: boolean;
  label?: string;
  labelClassName?: string;
  minDate?: Date;
  maxDate?: Date;
  onBlur?: FocusEventHandler;
  placeholderFrom?: string;
  placeholderTo?: string;
};

type Props = SingleDatePickerProps | RangeDatePickerProps;

export const DatePicker = (props: Props) => {
  const {
    className,
    label,
    labelClassName,
    type,
    disabled = false,
    minDate,
    maxDate,
    disabledDates,
  } = props;

  if (type === "range") {
    const {
      value,
      placeholderFrom = "Start date",
      placeholderTo = "End date",
    } = props as RangeDatePickerProps;
    const fromDisplay = value.from ? format(value.from, "MMM dd, yyyy") : "";
    const toDisplay = value.to ? format(value.to, "MMM dd, yyyy") : "";

    return (
      <div className={cn("flex flex-col gap-y-1", className)}>
        {label && (
          <label className={cn("text-sm font-medium text-neutral-700", labelClassName)}>
            {label}
          </label>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-x-2">
              <button
                type="button"
                disabled={disabled}
                className={cn(
                  "flex h-8 flex-1 items-center justify-between gap-x-2 rounded-xs border border-neutral-300 bg-white px-3 text-sm transition-colors",
                  "focus:border-primary-500 hover:border-neutral-400 focus:outline-none",
                  disabled && "cursor-not-allowed opacity-50",
                  !fromDisplay && "text-neutral-400",
                )}
              >
                <span className="truncate">{fromDisplay || placeholderFrom}</span>
                <CalendarIcon className="size-4 shrink-0 text-neutral-500" />
              </button>
              <span className="text-neutral-400">-</span>
              <button
                type="button"
                disabled={disabled}
                className={cn(
                  "flex h-8 flex-1 items-center justify-between gap-x-2 rounded-xs border border-neutral-300 bg-white px-3 text-sm transition-colors",
                  "focus:border-primary-500 hover:border-neutral-400 focus:outline-none",
                  disabled && "cursor-not-allowed opacity-50",
                  !toDisplay && "text-neutral-400",
                )}
              >
                <span className="truncate">{toDisplay || placeholderTo}</span>
                <CalendarIcon className="size-4 shrink-0 text-neutral-500" />
              </button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <Calendar
              mode="range"
              numberOfMonths={2}
              value={(props as RangeDatePickerProps).value}
              onSelect={(props as RangeDatePickerProps).onValueChange}
              minDate={minDate}
              maxDate={maxDate}
              disabledDates={disabledDates}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  const { value, placeholder = "Select date" } = props as SingleDatePickerProps;
  const displayValue = value ? format(value, "MMM dd, yyyy") : "";

  return (
    <div className={cn("flex flex-col gap-y-1", className)}>
      {label && (
        <label className={cn("text-sm font-medium text-neutral-700", labelClassName)}>
          {label}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-8 w-full items-center justify-between gap-x-2 rounded-xs border border-neutral-300 bg-white px-3 text-sm transition-colors",
              "focus:border-primary-500 f hover:border-neutral-400 focus:outline-none",
              disabled && "cursor-not-allowed opacity-50",
              !displayValue && "text-neutral-400",
            )}
          >
            <span className="truncate">{displayValue || placeholder}</span>
            <CalendarIcon className="size-4 shrink-0 text-neutral-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar
            mode="single"
            value={(props as SingleDatePickerProps).value}
            onSelect={(props as SingleDatePickerProps).onValueChange}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
