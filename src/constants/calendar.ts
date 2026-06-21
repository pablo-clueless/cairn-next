import { Ban, CircleAlert, CircleCheck, CornerUpRight, Link, Webhook } from "lucide-react";

export const DAYS_OF_WEEK = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
];

export const MONTHS_OF_YEAR = [
  { label: "January", value: "januray" },
  { label: "February", value: "february" },
  { label: "March", value: "march" },
  { label: "April", value: "april" },
  { label: "May", value: "may" },
  { label: "June", value: "june" },
  { label: "July", value: "july" },
  { label: "August", value: "august" },
  { label: "September", value: "september" },
  { label: "October", value: "october" },
  { label: "November", value: "november" },
  { label: "December", value: "december" },
];

export const TIMELINE_LEGENDS = [
  {
    name: "General",
    items: [
      { name: "Sprints", icon: Webhook, className: "text-foreground" },
      { name: "Dependency", icon: Link, className: "text-foreground" },
      { name: "Inferred value", icon: CornerUpRight, className: "text-foreground" },
    ],
  },
  {
    name: "Work item bars",
    items: [
      { name: "No end date", icon: null, className: "bg-linear-to-r from-black to-white" },
      { name: "No start date", icon: null, className: "bg-linear-to-r from-white to-black" },
    ],
  },
  {
    name: "Releases",
    items: [
      { name: "Released", icon: CircleCheck, className: "text-green-500" },
      { name: "Unreleased", icon: Ban, className: "text-blue-500" },
      { name: "Overdue", icon: CircleAlert, className: "text-red-500" },
    ],
  },
];
