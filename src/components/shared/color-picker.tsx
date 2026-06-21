"use client";

import { ChromePicker, type ColorResult } from "react-color";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface Props {
  onChange: (value: string) => void;
  value?: string;
  disabled?: boolean;
}

export const ColorPicker = ({ onChange, value = "#000000", disabled }: Props) => {
  const [text, setText] = useState(value);

  const handlePickerChange = (result: ColorResult) => {
    const hex = result.hex.toUpperCase();
    setText(hex);
    onChange(hex);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleTextBlur = () => {
    const raw = text.trim();
    const withHash = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(withHash)) {
      const upper = withHash.toUpperCase();
      setText(upper);
      onChange(upper);
    } else {
      setText(value);
    }
  };

  return (
    <div className="flex h-9 w-full items-center gap-x-2 rounded-md border px-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="h-5 w-20 shrink-0 rounded border disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: value }}
            aria-label="Open color picker"
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <ChromePicker color={value} onChange={handlePickerChange} disableAlpha />
        </PopoverContent>
      </Popover>
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        disabled={disabled}
        maxLength={7}
        placeholder="#000000"
        spellCheck={false}
        className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};
