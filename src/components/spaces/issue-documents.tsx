"use client";

import { Settings, X } from "lucide-react";
import { useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DOCUMENT_SORTS, DOCUMENT_TYPES } from "@/constants/documents";
import { useValues } from "@/hooks/use-values";
import { ScrollArea } from "../shared";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export const IssueDocuments = ({}: { slug: string; spaceKey: string }) => {
  const { onValueChange, values } = useValues({ search: "", sort: "", type: "" });
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <Input
            className="w-48"
            onChange={(e) => onValueChange("search", e.target.value)}
            placeholder="Search board"
            type="search"
            value={values.search}
          />
          <Select onValueChange={(value) => onValueChange("type", value)} value={values.type}>
            <SelectTrigger className="w-40 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem className="text-xs" key={type.value} value={type.value}>
                  <type.icon className="size-4" />
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => onValueChange("sort", value)} value={values.sort}>
            <SelectTrigger className="w-32 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              {DOCUMENT_SORTS.map((type) => (
                <SelectItem className="text-xs" key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog onOpenChange={(open) => setOpen(open)} open={open}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)} variant="outline">
              <Settings className="size-4" />
              Manage connection
            </Button>
          </DialogTrigger>
          <DialogContent className="gap-0 p-0 sm:max-w-150" showCloseButton={false}>
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <DialogTitle>Manage connections</DialogTitle>
                <DialogDescription>
                  Add or remove connections to external services
                </DialogDescription>
              </div>
              <Button onClick={() => setOpen(false)} size="icon" variant="ghost">
                <X />
              </Button>
            </div>
            <ScrollArea className="h-150">
              <div className="min-h-0"></div>
            </ScrollArea>
            <div className="border-t p-4"></div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-muted rounded-xs p-4">
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger></AccordionTrigger>
            <AccordionContent></AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};
