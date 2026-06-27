"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSearchIssues } from "@/hooks/use-search";

interface SearchCommandProps {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchCommand = ({ slug, open, onOpenChange }: SearchCommandProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const search = useSearchIssues(slug, debounced);
  const results = search.data ?? [];
  const active = debounced.trim().length >= 2;

  // Clear the box when the dialog closes (so it reopens empty).
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setQuery("");
      setDebounced("");
    }
    onOpenChange(next);
  };

  const go = (issueKey: string) => {
    handleOpenChange(false);
    router.push(`/org/${slug}/issues/${issueKey}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} title="Search" description="Search issues">
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search issues by title, description, or key…"
        />
        <CommandList>
          {active && search.isFetching && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
              <Loader2Icon className="size-4 animate-spin" /> Searching…
            </div>
          )}
          {active && !search.isFetching && (
            <CommandEmpty>No issues found.</CommandEmpty>
          )}
          {!active && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Type at least 2 characters to search.
            </p>
          )}
          {results.length > 0 && (
            <CommandGroup heading="Issues">
              {results.map((issue) => (
                <CommandItem
                  key={issue.id}
                  value={issue.id}
                  onSelect={() => go(issue.key)}
                  className="flex items-center gap-2"
                >
                  <span className="text-muted-foreground font-mono text-xs">{issue.key}</span>
                  <span className="truncate">{issue.title}</span>
                  <span className="text-muted-foreground ml-auto shrink-0 text-xs capitalize">
                    {issue.status}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
};
