export function getInitials(name: string | undefined) {
  if (!name) return "";
  const names = name.split(" ");
  const initials = names.map((n) => n.charAt(0).toUpperCase()).join("");
  return initials;
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

/**
 * Formats an ISO timestamp as a short relative time ("3 minutes ago",
 * "yesterday"). Falls back to "just now" for anything under a minute.
 */
export function formatRelativeTime(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  for (const [unit, secondsPerUnit] of RELATIVE_UNITS) {
    if (seconds >= secondsPerUnit) {
      return relativeFormatter.format(-Math.floor(seconds / secondsPerUnit), unit);
    }
  }
  return "just now";
}

export function capitalize(str?: string) {
  if (!str) return "";
  if (str.length === 1) return str.toUpperCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function fromKebabCase(str?: string) {
  if (!str) return "";
  return str.replace(/-/g, " ");
}

export function fromPascalCase(str?: string) {
  if (!str) return "";
  return str.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function fromCamelCase(str?: string) {
  if (!str) return "";
  return str.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

export function fromSnakeCase(str?: string) {
  if (!str) return "";
  return str.replace(/_/g, " ");
}

export function toKebabCase(str?: string) {
  if (!str) return "";
  return str.toLowerCase().replace(/ /g, "-");
}

export function toPascalCase(str?: string) {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/ /g, "")
    .replace(/^./, (str) => str.toUpperCase());
}

export function toCamelCase(str?: string) {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/ /g, "")
    .replace(/^./, (str) => str.toLowerCase());
}

export function toSnakeCase(str?: string) {
  if (!str) return "";
  return str.toLowerCase().replace(/ /g, "_");
}
