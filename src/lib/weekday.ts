import { addDays } from "date-fns";

/** True when the date falls on Monday–Friday. */
export const isWeekday = (date: Date): boolean => {
  const day = date.getDay(); // 0 = Sunday … 6 = Saturday
  return day !== 0 && day !== 6;
};

/**
 * If the date lands on a weekend, advance it to the following Monday;
 * otherwise return it unchanged. Used to keep pre-filled sprint dates valid.
 */
export const nextWeekday = (date: Date): Date => {
  const day = date.getDay();
  if (day === 6) return addDays(date, 2); // Saturday → Monday
  if (day === 0) return addDays(date, 1); // Sunday → Monday
  return date;
};
