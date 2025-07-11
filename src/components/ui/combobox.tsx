
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export type ComboboxOption = {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    notFoundContent?: React.ReactNode;
    className?: string;
}

export function Combobox({ options, value, onChange, placeholder, notFoundContent, className }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value ? options.find(o => o.value === value)?.label : "");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    setInputValue(value ? options.find(o => o.value === value)?.label : "");
  }, [value, options]);

  const handleSelect = (currentValue: string) => {
    const option = options.find(o => o.value === currentValue);
    if (option) {
        setInputValue(option.label);
        onChange(option.value);
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Button
        ref={triggerRef}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("w-full justify-between font-normal", className)}
        onClick={() => setOpen(prev => !prev)}
      >
        <span className="truncate">
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder || "Select option..."}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-0 shadow-md"
          style={{
            width: triggerRef.current?.offsetWidth
          }}
        >
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>{notFoundContent || "No option found."}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
