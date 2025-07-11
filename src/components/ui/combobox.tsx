
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

  // Find the label for the currently selected value.
  const selectedLabel = React.useMemo(() => {
    return options.find((option) => option.value === value)?.label;
  }, [options, value]);

  // This is the correct handler for when an item is selected.
  // `currentValue` will be the `value` prop from the `CommandItem`, which we set to the option's unique ID.
  const handleSelect = (currentValue: string) => {
    onChange(currentValue); // Update the form state with the unique value.
    setOpen(false);       // Close the popover.
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          {value ? selectedLabel : placeholder || "Select option..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
                <CommandEmpty>{notFoundContent || "No option found."}</CommandEmpty>
                <CommandGroup>
                    {options.map((option) => (
                        <CommandItem
                            key={option.value}
                            value={option.value} // The value used for selection *must* be the unique ID.
                            onSelect={handleSelect} // The onSelect event provides the `value`.
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
