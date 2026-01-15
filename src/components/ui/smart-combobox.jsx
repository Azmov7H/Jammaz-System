'use client';

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Search, Package } from "lucide-react"
import { motion } from "framer-motion"
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

export function SmartCombobox({ options = [], value, onChange, placeholder = "Select...", onCreate, className }) {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")

    const exactMatch = options.find((opt) => opt.value.toLowerCase() === searchValue.toLowerCase())

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between bg-white/[0.03] border-white/10 hover:border-primary/40 hover:bg-white/[0.06] text-foreground rounded-2xl h-12 px-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 group backdrop-blur-md",
                        className
                    )}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="truncate font-bold text-base tracking-tight">
                            {value
                                ? options.find((opt) => opt.value === value)?.label || value
                                : placeholder}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-[#0f172a]/95 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden border-t-white/20 animate-in fade-in zoom-in duration-200"
                align="start"
                sideOffset={12}
            >
                <Command className="bg-transparent">
                    <div className="relative border-b border-white/10">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                        <CommandInput
                            placeholder={`ابحث عن ${placeholder.toLowerCase()}...`}
                            value={searchValue}
                            onValueChange={setSearchValue}
                            className="h-14 pr-11 bg-transparent font-bold text-base focus:ring-0 placeholder:text-muted-foreground/50 border-0"
                        />
                    </div>
                    <CommandList className="max-h-[350px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <CommandEmpty className="py-10 px-4 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <Package className="w-8 h-8 text-primary/40" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black text-foreground/80">لم نجد ما تبحث عنه</p>
                                    <p className="text-xs text-muted-foreground font-medium">حاول البحث بكلمات مختلفة</p>
                                </div>

                                {onCreate && searchValue && !exactMatch && (
                                    <button
                                        className="mt-2 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm bg-primary text-primary-foreground font-black hover:scale-105 transition-transform shadow-lg shadow-primary/20"
                                        onClick={() => {
                                            onCreate(searchValue);
                                            onChange(searchValue);
                                            setOpen(false);
                                            setSearchValue("");
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        إضافة "{searchValue}" جديد
                                    </button>
                                )}
                            </motion.div>
                        </CommandEmpty>
                        <CommandGroup className="p-2">
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onChange(option.value === value ? "" : option.value)
                                        setOpen(false)
                                    }}
                                    className="p-4 cursor-pointer hover:bg-white/5 aria-selected:bg-primary/10 aria-selected:text-primary rounded-xl transition-all duration-200 flex items-center gap-3 my-1 border border-transparent hover:border-white/5 active:scale-[0.98]"
                                >
                                    <div className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        value === option.value ? "bg-primary scale-125 shadow-[0_0_8px_rgba(var(--primary),0.6)]" : "bg-white/10"
                                    )} />
                                    <div className="flex-1 flex flex-col">
                                        <span className="font-black text-sm tracking-tight leading-tight">{option.label}</span>
                                        {/* Optional subtitle if label has | separator */}
                                        {option.label.includes('|') && (
                                            <span className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">
                                                {option.label.split('|')[1].trim()}
                                            </span>
                                        )}
                                    </div>
                                    <Check
                                        className={cn(
                                            "h-4 w-4 shrink-0 transition-opacity",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
