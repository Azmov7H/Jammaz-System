'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Loader2,
    ArrowRight,
    ClipboardCheck,
    ShieldCheck,
    LayoutGrid,
    Warehouse,
    Store,
    Layers,
    Sparkles,
    SearchX
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { usePhysicalInventory } from '@/hooks/usePhysicalInventory';
import { useProductMetadata } from '@/hooks/useProducts';

export default function NewPhysicalInventoryPage() {
    const router = useRouter();
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState('all');
    const [isBlind, setIsBlind] = useState(false);

    const { createMutation } = usePhysicalInventory();
    const { data: metadata, isLoading: fetchingMetadata } = useProductMetadata();
    const categories = metadata?.categories || [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) return;

        createMutation.mutate({
            location,
            category: category === 'all' ? null : category,
            isBlind
        }, {
            onSuccess: (res) => {
                toast.success('تم بدء عملية الجرد بنجاح');
                router.push(`/physical-inventory/${res.data._id}`);
            },
            onError: (error) => {
                toast.error(error.message || 'فشل بدء الجرد');
            }
        });
    };

    return (
        <div className="container max-w-2xl mx-auto py-12 px-4">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <Button
                    variant="ghost"
                    className="mb-8 hover:bg-primary/5 text-muted-foreground group"
                    onClick={() => router.back()}
                >
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    العودة لمركز الجرد
                </Button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="glass-card border-0 shadow-custom-xl overflow-hidden rounded-[2.5rem]">
                    <div className="h-2 w-full gradient-primary" />
                    <CardHeader className="text-center pt-10 pb-6">
                        <div className="mx-auto w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-6 rotate-3">
                            <ClipboardCheck className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight mb-2">بدء جرد ذكي</CardTitle>
                        <CardDescription className="text-base font-medium">قم بتهيئة جلسة الجرد الفعلية لضمان دقة المخزون</CardDescription>
                    </CardHeader>

                    <CardContent className="p-8 pt-4">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Location Section */}
                            <div className="space-y-4">
                                <Label className="text-sm font-black flex items-center gap-2 text-primary/80">
                                    <Warehouse className="w-4 h-4" /> موقع الجرد
                                </Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'warehouse', label: 'المخزن', icon: Warehouse },
                                        { id: 'shop', label: 'المحل', icon: Store },
                                        { id: 'both', label: 'شامل', icon: Layers },
                                    ].map((loc) => (
                                        <button
                                            key={loc.id}
                                            type="button"
                                            onClick={() => setLocation(loc.id)}
                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${location === loc.id
                                                ? 'border-primary bg-primary/5 shadow-inner-lg'
                                                : 'border-transparent bg-muted/30 hover:bg-muted/50'
                                                }`}
                                        >
                                            <loc.icon className={`w-6 h-6 ${location === loc.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <span className={`text-xs font-bold ${location === loc.id ? 'text-primary' : 'text-muted-foreground'}`}>{loc.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Section */}
                            <div className="space-y-4">
                                <Label className="text-sm font-black flex items-center gap-2 text-primary/80">
                                    <LayoutGrid className="w-4 h-4" /> القسم المختار
                                </Label>
                                <Select value={category} onValueChange={setCategory} disabled={fetchingMetadata}>
                                    <SelectTrigger className="h-14 rounded-2xl border-0 bg-muted/30 font-bold focus:ring-2 ring-primary/20">
                                        <SelectValue placeholder={fetchingMetadata ? "جاري تحميل الأقسام..." : "اختر القسم (أو جرد شامل)"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-custom-xl">
                                        <SelectItem value="all" className="font-bold py-3 text-primary">كل الأقسام (جرد شامل)</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.value} value={cat.value} className="font-medium">
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Options Section */}
                            <div className="p-6 rounded-3xl bg-primary/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base font-black flex items-center gap-2">
                                            <SearchX className="w-4 h-4 text-primary" /> الجرد الأعمى (Blind Count)
                                        </Label>
                                        <p className="text-xs text-muted-foreground font-medium">إخفاء كميات النظام لضمان دقة الجرد الفعلي</p>
                                    </div>
                                    <Switch
                                        checked={isBlind}
                                        onCheckedChange={setIsBlind}
                                        className="data-[state=active]:bg-primary"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-16 rounded-[1.5rem] gradient-primary text-lg font-black shadow-lg shadow-primary/30 hover-scale group"
                                disabled={!location || createMutation.isPending}
                            >
                                {createMutation.isPending ? (
                                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                                )}
                                بدء جلسة الجرد
                            </Button>
                        </form>

                        <div className="mt-8 flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                            <ShieldCheck className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                            <p className="text-xs text-amber-900/60 font-bold leading-relaxed">
                                سيتم تسجيل "لقطة" (Snapshot) لمخزون اللحظة الحالية. جميع المبيعات أو المشتريات التي تتم أثناء الجرد ستحتاج مراجعة يدوية إذا تقاطعت مع المنتجات المجرودة.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
