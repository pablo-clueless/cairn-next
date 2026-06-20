import { Settings2 } from "lucide-react";
import Link from "next/link";

import { createColumns, DateCell } from "./shared";
import type { Organization } from "@/types";

export const organizations = createColumns<Organization>({
  columns: [
    {
      accessorKey: "name",
      header: "Organization",
      cell: ({ row }) => (
        <Link
          href={`/dashboard/organizations/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: "slug", header: "Slug" },
    { accessorKey: "status", header: "Status" },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => <DateCell date={row.original.created_at} />,
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      cell: ({ row }) => <DateCell date={row.original.updated_at} />,
    },
  ],
  actions: (org) => [
    { label: "Manage", icon: Settings2, href: `/dashboard/organizations/${org.id}` },
  ],
});
