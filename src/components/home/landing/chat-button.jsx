"use client"
import React from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ChatButton() {
    return (
        <Button
            aria-label="chat"
            size="icon"
            className="fixed right-6 bottom-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl hover:scale-105 transition-transform"
        >
            <MessageSquare className="h-7 w-7" />
        </Button>
    )
}