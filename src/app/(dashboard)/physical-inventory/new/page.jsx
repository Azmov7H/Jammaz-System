'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function NewPhysicalInventoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) return;

        setLoading(true);
        try {
            const res = await fetch('/api/physical-inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to create count');

            toast.success('تم بدء عملية الجرد بنجاح');
            router.push(`/physical-inventory/${data.count._id}`);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-12">
            <Button
                variant="ghost"
                className="mb-6"
                onClick={() => router.back()}
            >
                <ArrowRight className="ml-2 h-4 w-4" />
                عودة
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl text-center">بدء جرد جديد</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>موقع الجرد</Label>
                            <Select value={location} onValueChange={setLocation}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الموقع المراد جرده" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="warehouse">المخزن الرئيسي</SelectItem>
                                    <SelectItem value="shop">المحل</SelectItem>
                                    <SelectItem value="both">جرد شامل (المخزن + المحل)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground mt-2">
                                * سيتم تحميل جميع المنتجات المسجلة في النظام وعرض كمياتها الحالية للمقارنة.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!location || loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            بدء الجرد
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
