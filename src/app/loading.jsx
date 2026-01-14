import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20" />
                    <Loader2 className="w-12 h-12 text-primary animate-spin absolute inset-0" />
                </div>
                <p className="text-sm font-black text-primary animate-pulse tracking-widest uppercase">
                    جاري التحميل...
                </p>
            </div>
        </div>
    )
}
