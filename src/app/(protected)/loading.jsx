import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="space-y-8 p-6 animate-pulse" dir="rtl">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <div className="h-10 w-48 bg-muted rounded-xl" />
                    <div className="h-4 w-64 bg-muted/60 rounded-lg" />
                </div>
                <div className="h-10 w-32 bg-muted rounded-xl" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-muted rounded-3xl" />
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
                <div className="lg:col-span-2 space-y-8">
                    <div className="h-64 bg-muted rounded-[2rem]" />
                    <div className="h-96 bg-muted rounded-[2rem]" />
                </div>
                <div className="space-y-8">
                    <div className="h-64 bg-muted rounded-[2rem]" />
                    <div className="h-64 bg-muted rounded-[2rem]" />
                </div>
            </div>
        </div>
    )
}
