"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSprints } from "@/hooks/use-sprints";
import { useBurndown, useCFD, useVelocity } from "@/hooks/use-reports";

const shortDate = (d: string) => d.slice(5); // MM-DD

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</h3>
    <div className="h-64 rounded-xs border p-4">{children}</div>
  </section>
);

const Empty = ({ text }: { text: string }) => (
  <div className="text-muted-foreground grid h-full place-items-center text-sm">{text}</div>
);

export function SpaceAgileReports({ slug, spaceKey }: { slug: string; spaceKey: string }) {
  const velocity = useVelocity(slug, spaceKey);
  const cfd = useCFD(slug, spaceKey, 30);
  const sprints = useSprints(slug, spaceKey);

  const [sprintId, setSprintId] = useState<string>();
  const active = sprints.data?.find((s) => s.status === "active");
  const selectedSprint = sprintId ?? active?.id ?? sprints.data?.[0]?.id;
  const burndown = useBurndown(slug, spaceKey, selectedSprint);

  const velocityData = velocity.data ?? [];
  const cfdData = cfd.data ?? [];
  const burndownData = burndown.data ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Velocity (completed sprints)">
        {velocityData.length === 0 ? (
          <Empty text="No completed sprints yet." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="sprint_name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Committed" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Cumulative flow (30 days)">
        {cfdData.length === 0 ? (
          <Empty text="No data yet." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cfdData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="done"
                name="Done"
                stackId="1"
                stroke="#22c55e"
                fill="#22c55e"
              />
              <Area
                type="monotone"
                dataKey="in_progress"
                name="In Progress"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
              />
              <Area
                type="monotone"
                dataKey="todo"
                name="To Do"
                stackId="1"
                stroke="#94a3b8"
                fill="#94a3b8"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Burndown">
        <div className="flex h-full flex-col gap-2">
          <Select value={selectedSprint} onValueChange={setSprintId}>
            <SelectTrigger className="w-56 self-end">
              <SelectValue placeholder="Select a sprint" />
            </SelectTrigger>
            <SelectContent>
              {(sprints.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                  {s.status === "active" ? " (active)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectedSprint ? (
            <Empty text="No sprints yet." />
          ) : burndownData.length === 0 ? (
            <Empty text="No burndown data for this sprint yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  name="Ideal"
                  stroke="#cbd5e1"
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line type="monotone" dataKey="remaining" name="Remaining" stroke="#ef4444" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>
    </div>
  );
}
