import { type LucideIcon, MoreVertical } from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionVariant = "default" | "danger" | "info" | "success" | "warning";

const variants: Record<ActionVariant, string> = {
  danger: "text-red-700 hover:bg-red-100",
  default: "text-gray-700 hover:bg-gray-100",
  info: "text-blue-700 hover:bg-blue-100",
  success: "text-green-700 hover:bg-green-100",
  warning: "text-yellow-700 hover:bg-yellow-100",
};

interface ActionItem<T extends object> {
  label: string;
  hidden?: boolean | ((args: T) => boolean);
  href?: string | ((args: T) => string);
  icon?: LucideIcon;
  onClick?: (args: T) => void;
  variant?: ActionVariant | (string & {});
}

interface ActionColumnConfig<T extends object> {
  actions: (row: T) => ActionItem<T>[];
  row: T;
}

export const ActionCell = <T extends object>({ actions, row }: ActionColumnConfig<T>) => {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost">
            <MoreVertical className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 p-1">
          <div className="w-full space-y-1">
            {actions(row).map((action) => {
              const href = action.href
                ? typeof action.href === "function"
                  ? action.href(row)
                  : action.href
                : undefined;
              const variant = (action.variant ? action.variant : "default") as ActionVariant;
              const hidden = action.hidden
                ? typeof action.hidden === "function"
                  ? action.hidden(row)
                  : action.hidden
                : false;

              if (href) {
                return (
                  <Link
                    className={cn(
                      "flex w-full items-center gap-x-2 rounded-xs px-2.5 py-2 text-sm",
                      variants[variant],
                      hidden && "hidden",
                    )}
                    href={href}
                    key={action.label}
                  >
                    {action.icon && <action.icon className="size-4" />}
                    {action.label}
                  </Link>
                );
              } else {
                return (
                  <button
                    className={cn(
                      "flex w-full items-center gap-x-2 rounded-xs px-2.5 py-2 text-sm",
                      variants[variant],
                      hidden && "hidden",
                    )}
                    key={action.label}
                    onClick={() => action.onClick?.(row)}
                  >
                    {action.icon && <action.icon className="size-4" />}
                    {action.label}
                  </button>
                );
              }
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface CreateColumnProps<T extends object> {
  columns: ColumnDef<T>[];
  actionColumnHeader?: string;
  actionColumnId?: string;
  actions?: (args: T) => ActionItem<T>[];
  isSelectable?: boolean;
  isSortable?: boolean;
}

export const createColumns = <T extends object>({
  columns,
  actionColumnHeader,
  actionColumnId,
  actions,
  isSelectable,
  isSortable,
}: CreateColumnProps<T>) => {
  const updatedColumns: ColumnDef<T>[] = [];

  if (isSelectable) {
    updatedColumns.push({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="select one"
        />
      ),
      enableSorting: isSortable,
    });
  }

  updatedColumns.push(...columns);

  if (actions) {
    updatedColumns.push({
      id: actionColumnId || "actions",
      header: actionColumnHeader || "",
      cell: ({ row }) => <ActionCell actions={actions} row={row.original} />,
    });
  }

  return updatedColumns;
};

export const DateCell = ({
  date,
  className,
}: {
  date: Date | string | null;
  className?: string;
}) => {
  if (!date) return <div className={cn("text-muted-foreground", className)}>—</div>;
  return <div className={className}>{format(new Date(date), "dd/MM/yyyy")}</div>;
};

export const TimeCell = ({
  date,
  className,
}: {
  date: Date | string | null;
  className?: string;
}) => {
  if (!date) return <div className={cn("text-muted-foreground", className)}>—</div>;
  return <div className={className}>{format(new Date(date), "HH:mm")}</div>;
};

export const DateTimeCell = ({
  date,
  className,
}: {
  date: Date | string | null;
  className?: string;
}) => {
  if (!date) return <div className={cn("text-muted-foreground", className)}>—</div>;
  return <div className={className}>{format(new Date(date), "dd/MM/yyyy, HH:mm")}</div>;
};

export const RelativeTimeCell = ({
  date,
  className,
}: {
  date: Date | string | null;
  className?: string;
}) => {
  if (!date) return <div className={cn("text-muted-foreground", className)}>—</div>;
  return (
    <div title={format(new Date(date), "dd/MM/yyyy HH:mm")} className={className}>
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </div>
  );
};

export const NumberCell = ({ value }: { value: number }) => {
  return <span>{new Intl.NumberFormat().format(value)}</span>;
};

export const PercentageCell = ({ value, decimals = 1 }: { value: number; decimals?: number }) => {
  return <span>{value.toFixed(decimals)}%</span>;
};

export const BooleanCell = ({
  value,
  labels = ["Yes", "No"],
}: {
  value: boolean;
  labels?: [string, string];
}) => {
  return (
    <span className={cn("text-xs font-medium", value ? "text-green-600" : "text-red-500")}>
      {value ? labels[0] : labels[1]}
    </span>
  );
};

export type StatusVariant = "default" | "danger" | "info" | "success" | "warning";

const STATUS_DEFAULTS: Record<string, StatusVariant> = {
  active: "success",
  approved: "success",
  completed: "success",
  paid: "success",
  published: "success",
  cancelled: "danger",
  failed: "danger",
  rejected: "danger",
  terminated: "danger",
  draft: "default",
  "in-progress": "warning",
  inactive: "default",
  pending: "warning",
  review: "info",
  suspended: "default",
};

export const STATUS_STYLES: Record<StatusVariant, string> = {
  default: "bg-gray-100 text-gray-500 border-gray-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
  success: "bg-green-100 text-green-700 border-green-200",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

interface StatusCellProps<TStatus extends string> {
  status: TStatus;
  config?: Partial<Record<TStatus, StatusVariant>>;
}

export const StatusCell = <TStatus extends string>({
  status,
  config,
}: StatusCellProps<TStatus>) => {
  const map: Record<string, StatusVariant> = config
    ? { ...STATUS_DEFAULTS, ...config }
    : STATUS_DEFAULTS;
  const variant = map[status.toLowerCase()] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[variant],
      )}
    >
      {status.replace(/-/g, " ")}
    </span>
  );
};

export const SerialNumberCell = <T extends object>({ row }: { row: Row<T> }) => (
  <span>{row.index + 1}</span>
);
