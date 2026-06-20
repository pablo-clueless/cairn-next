"use client";

import {
  addMonths,
  format,
  subMonths,
  isAfter,
  isBefore,
  isSameDay,
  startOfMonth,
  isWithinInterval,
} from "date-fns";
import { ChevronLeftIcon } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

type CalendarProps = {
  className?: string;
  disabledDates?: Date[];
  maxDate?: Date;
  minDate?: Date;
  numberOfMonths?: number;
} & (
  | {
      mode?: "single";
      onSelect: (date: Date | undefined) => void;
      value: Date | undefined;
    }
  | {
      mode: "range";
      onSelect: (range: DateRange) => void;
      value: DateRange;
    }
);

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export const Calendar = (props: CalendarProps) => {
  const { className, disabledDates, maxDate, minDate, mode = "single", numberOfMonths = 1 } = props;
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date());

  const isDateDisabled = React.useCallback(
    (date?: Date): boolean => {
      if (!date) return false;
      if (minDate && isBefore(date, minDate)) return true;
      if (maxDate && isAfter(date, maxDate)) return true;
      if (disabledDates?.some((disabledDate) => isSameDay(date, disabledDate))) return true;
      return false;
    },
    [minDate, maxDate, disabledDates],
  );

  const isSelected = React.useCallback(
    (day?: Date): boolean => {
      if (!day) return false;
      if (mode === "single") {
        const { value } = props as { value: Date | undefined };
        return !!value && isSameDay(day, value);
      }
      const { value } = props as { value: DateRange };
      return (
        (!!value.from && isSameDay(day, value.from)) || (!!value.to && isSameDay(day, value.to))
      );
    },
    [mode, props],
  );

  const isInRange = React.useCallback(
    (day?: Date): boolean => {
      if (!day || mode !== "range") return false;
      const { value } = props as { value: DateRange };
      if (!value.from || !value.to) return false;
      return isWithinInterval(day, { start: value.from, end: value.to });
    },
    [mode, props],
  );

  const isRangeStart = React.useCallback(
    (day?: Date): boolean => {
      if (!day || mode !== "range") return false;
      const { value } = props as { value: DateRange };
      return !!value.from && isSameDay(day, value.from);
    },
    [mode, props],
  );

  const isRangeEnd = React.useCallback(
    (day?: Date): boolean => {
      if (!day || mode !== "range") return false;
      const { value } = props as { value: DateRange };
      return !!value.to && isSameDay(day, value.to);
    },
    [mode, props],
  );

  const handlePreviousMonth = React.useCallback(() => {
    const prevMonth = subMonths(currentMonth, 1);
    if (minDate && isBefore(prevMonth, startOfMonth(minDate))) return;
    setCurrentMonth(prevMonth);
  }, [currentMonth, minDate]);

  const handleNextMonth = React.useCallback(() => {
    const nextMonth = addMonths(currentMonth, 1);
    if (maxDate && isAfter(addMonths(nextMonth, numberOfMonths - 1), startOfMonth(maxDate))) return;
    setCurrentMonth(nextMonth);
  }, [currentMonth, maxDate, numberOfMonths]);

  const getCalendarDays = React.useCallback((monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days: (Date | undefined)[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(undefined);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, []);

  const months = React.useMemo(() => {
    return Array.from({ length: numberOfMonths }, (_, i) => addMonths(currentMonth, i));
  }, [currentMonth, numberOfMonths]);

  const isPrevDisabled = React.useMemo(() => {
    return minDate ? isBefore(subMonths(currentMonth, 1), startOfMonth(minDate)) : false;
  }, [currentMonth, minDate]);

  const isNextDisabled = React.useMemo(() => {
    const lastMonth = addMonths(currentMonth, numberOfMonths - 1);
    return maxDate ? isAfter(addMonths(lastMonth, 1), startOfMonth(maxDate)) : false;
  }, [currentMonth, maxDate, numberOfMonths]);

  const handleDayClick = React.useCallback(
    (day: Date | undefined) => {
      if (!day) return;

      if (mode === "single") {
        const { onSelect } = props as { onSelect: (date: Date | undefined) => void };
        onSelect(day);
      } else {
        const { onSelect, value } = props as {
          onSelect: (range: DateRange) => void;
          value: DateRange;
        };

        if (!value.from || (value.from && value.to)) {
          onSelect({ from: day, to: undefined });
        } else if (isBefore(day, value.from)) {
          onSelect({ from: day, to: value.from });
        } else {
          onSelect({ from: value.from, to: day });
        }
      }
    },
    [mode, props],
  );

  return (
    <div className={cn("flex gap-x-4", className)}>
      {months.map((monthDate, monthIndex) => {
        const calendarDays = getCalendarDays(monthDate);
        const isFirstMonth = monthIndex === 0;
        const isLastMonth = monthIndex === numberOfMonths - 1;

        return (
          <div key={monthDate.toISOString()} className="w-full max-w-72 space-y-2">
            <div className="flex w-full items-center justify-between gap-x-4">
              {isFirstMonth ? (
                <button
                  className={cn(
                    "grid size-7 place-items-center rounded border border-neutral-400 transition-opacity",
                    isPrevDisabled && "cursor-not-allowed opacity-50",
                  )}
                  onClick={handlePreviousMonth}
                  disabled={isPrevDisabled}
                  type="button"
                  aria-label="Previous month"
                >
                  <ChevronLeftIcon className="size-4" />
                </button>
              ) : (
                <div className="size-7" />
              )}

              <div className="flex-1 text-center text-sm font-medium">
                {format(monthDate, "MMMM, yyyy")}
              </div>

              {isLastMonth ? (
                <button
                  className={cn(
                    "grid size-7 place-items-center rounded border border-neutral-400 transition-opacity",
                    isNextDisabled && "cursor-not-allowed opacity-50",
                  )}
                  onClick={handleNextMonth}
                  disabled={isNextDisabled}
                  type="button"
                  aria-label="Next month"
                >
                  <ChevronLeftIcon className="size-4 rotate-180" />
                </button>
              ) : (
                <div className="size-7" />
              )}
            </div>

            <div className="grid w-full grid-cols-7 gap-x-1">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="flex aspect-square items-center justify-center text-sm font-medium text-neutral-500"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid w-full grid-cols-7 gap-y-1">
              {calendarDays.map((day, index) => {
                const disabled = isDateDisabled(day);
                const selected = isSelected(day);
                const inRange = isInRange(day);
                const rangeStart = isRangeStart(day);
                const rangeEnd = isRangeEnd(day);

                return (
                  <div
                    key={`${monthDate.getMonth()}-${index}`}
                    className={cn(
                      "relative",
                      inRange && !rangeStart && !rangeEnd && "bg-primary-100",
                      rangeStart && "to-primary-100 rounded-l bg-linear-to-r from-transparent",
                      rangeEnd && "to-primary-100 rounded-r bg-linear-to-l from-transparent",
                      rangeStart && rangeEnd && "bg-transparent",
                    )}
                  >
                    <button
                      className={cn(
                        "relative z-10 aspect-square w-full rounded text-sm transition-colors",
                        day && !disabled && !selected && "hover:bg-neutral-300",
                        selected && "bg-primary-500 text-white",
                        inRange && !selected && "text-primary-700",
                        disabled && "cursor-not-allowed text-neutral-300 hover:bg-transparent",
                      )}
                      disabled={!day || disabled}
                      onClick={() => handleDayClick(day)}
                      type="button"
                      aria-label={day ? format(day, "EEEE, MMMM do, yyyy") : undefined}
                    >
                      {day && format(day, "d")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
