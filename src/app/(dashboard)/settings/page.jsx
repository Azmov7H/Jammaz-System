'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">الإعدادات</h1>
                <p className="text-sm text-slate-500">تخصيص خصائص النظام</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold border-b pb-2">حدود المخزون</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>الحد الأدنى الافتراضي للطلب</Label>
                        <Input type="number" defaultValue={5} />
                    </div>
                    <div className="space-y-2">
                        <Label>فترة التوريد المتوقعة (أيام)</Label>
                        <Input type="number" defaultValue={3} />
                    </div>
                </div>
                <div className="pt-4">
                    <Button>حفظ التغييرات</Button>
                </div>
            </div>
        </div>
    );
}
