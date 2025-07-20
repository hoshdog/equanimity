// src/components/ui/SearchableCombobox.tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import type { OptionType } from "@/lib/types"

interface SearchableComboboxProps {
  options: OptionType[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * A searchable Combobox component using Input and Popover.
 * Displays a filterable list of options and allows text selection.
 */
export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder,
  className,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedLabel =
    options.find(option => option.value === value)?.label || placeholder || "Select option..."

  const filteredOptions = React.useMemo(
    () =>
      options.filter(option =>
        option.label.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [options, search]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-2">
        <Input
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          placeholder="Search option..."
          className="mb-2"
        />
        <div className="max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-center text-sm text-muted-foreground select-text">
              No option found.
            </div>
          ) : (
            filteredOptions.map(option => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center p-2 rounded cursor-pointer select-text",
                  option.value === value
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                  setSearch("")
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    option.value === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="select-text">{option.label}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
