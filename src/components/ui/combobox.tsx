
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ComboboxOption = {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    notFoundContent?: React.ReactNode;
    className?: string;
}

export function Combobox({ options, value, onChange, placeholder, notFoundContent, className }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentValue: string) => {
    // The `currentValue` from onSelect is the `value` prop from CommandItem, which is the label.
    // Find the option with the matching label (case-insensitively) to get the actual value.
    const selectedOption = options.find(
      (option) => option.label.toLowerCase() === currentValue.toLowerCase()
    );

    if (selectedOption) {
        // If the user selects the currently selected item, it should effectively do nothing,
        // otherwise, update the value.
        if (value !== selectedOption.value) {
            onChange(selectedOption.value)
        }
    } else {
        // Handle case where selection might not find a match, though this is unlikely with this setup.
        onChange("")
    }
    setOpen(false)
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder || "Select option..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command onSelect={handleSelect} filter={(value, search) => {
            if (value.toLowerCase().includes(search.toLowerCase())) return 1
            return 0
        }}>
            <CommandInput placeholder="Search..." />
            <CommandList>
                <CommandEmpty>{notFoundContent || "No option found."}</CommandEmpty>
                <CommandGroup>
                    {options.map((option) => (
                        <CommandItem
                            key={option.value}
                            value={option.label}
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
      </PopoverContent>
    </Popover>
  )
}
