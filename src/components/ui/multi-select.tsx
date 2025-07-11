
"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, X, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export type OptionType = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: OptionType[];
  selected: OptionType[];
  onChange: (selected: OptionType[]) => void;
  className?: string;
  placeholder?: string;
}

function MultiSelect({
  options,
  selected,
  onChange,
  className,
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (option: OptionType) => {
    onChange([...selected, option]);
  };

  const handleDeselect = (option: OptionType) => {
    onChange(selected.filter((s) => s.value !== option.value));
  };
  
  // This is a bit of a hack to prevent the popover from closing when clicking on a selected item.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setOpen(true);
    }
  };


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div onKeyDown={handleKeyDown}>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn("w-full justify-between", className)}
              onClick={() => setOpen(!open)}
            >
              <div className="flex gap-1 flex-wrap">
                {selected.length > 0 ? (
                  selected.map((option) => (
                    <Badge
                      variant="secondary"
                      key={option.value}
                      className="mr-1 mb-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeselect(option);
                      }}
                    >
                      {option.label}
                      <button 
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleDeselect(option);
                            }
                        }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onClick={() => handleDeselect(option)}
                      >
                         <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <span>{props.placeholder ?? 'Select...'}</span>
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search ..." />
          <CommandEmpty>No item found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.some((s) => s.value === option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                        if (isSelected) {
                            handleDeselect(option);
                        } else {
                            handleSelect(option);
                        }
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect };
