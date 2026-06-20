/** Simple placeholder for routes whose features arrive in a later phase. */
export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-semibold">{title}</h1>
      <div className="rounded-xs border border-dashed p-12 text-center">
        <p className="text-muted-foreground">{note ?? "This is coming in a later phase."}</p>
      </div>
    </div>
  );
}
