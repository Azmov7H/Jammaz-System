'use client';

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from '@/utils'
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

export function SmartCombobox({ options = [], value, onChange, placeholder = "Select...", onCreate }) {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")

    // Filter options based on search, but also allow new
    const exactMatch = options.find((opt) => opt.value.toLowerCase() === searchValue.toLowerCase())

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-white"
                >
                    {value
                        ? options.find((opt) => opt.value === value)?.label || value
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={`Search ${placeholder.toLowerCase()}...`}
                        value={searchValue}
                        onValueChange={setSearchValue}
                    />
                    <CommandList>
                        <CommandEmpty className="py-2 px-2 text-sm">
                            {!exactMatch && searchValue && onCreate ? (
                                <button
                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                                    onClick={() => {
                                        onCreate(searchValue);
                                        onChange(searchValue);
                                        setOpen(false);
                                        setSearchValue("");
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                    Create "{searchValue}"
                                </button>
                            ) : (
                                "No results found."
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                    }}
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
