'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Package,
    Calendar,
    Users,
    Bell
} from 'lucide-react';
import { TabHeader } from './TabHeader';

export function AlertsSettingsTab({ settings, onChange }) {
    const set = (patch) => onChange({ ...settings, ...patch });

    return (
        <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
            <div className="p-12">
                <TabHeader
                    icon={Bell}
                    title="إشعارات النظام الذكية"
                    description="إدارة حدود المخزون وتذكيرات السداد التلقائي"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                    <div className="group space-y-6 p-8 rounded-[2.5rem] bg-warning/5 border border-warning/10 hover:bg-warning/10 transition-all duration-300">
                        <div className="h-16 w-16 rounded-2xl bg-warning/20 flex items-center justify-center text-warning shadow-lg shadow-warning/10 group-hover:rotate-6 transition-transform">
                            <Package size={32} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xl font-bold text-warning block">حد المخزون الحرج</Label>
                            <p className="text-sm font-bold text-warning/50 leading-relaxed">أقل كمية للمنتج قبل إطلاق تنبيه &quot;نقص المخزون&quot;</p>
                        </div>
                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl">
                            <Input
                                type="number"
                                value={settings.stockAlertThreshold || 0}
                                onChange={e => set({ stockAlertThreshold: parseInt(e.target.value) || 0 })}
                                className="h-12 w-24 text-2xl font-bold text-center border-0 bg-transparent text-warning"
                            />
                            <span className="font-bold text-warning/30 uppercase text-xs tracking-[0.3em]">وحدة</span>
                        </div>
                    </div>

                    <div className="group space-y-6 p-8 rounded-[2.5rem] bg-info/10 border border-info/10 hover:bg-info/10 transition-all duration-300">
                        <div className="h-16 w-16 rounded-2xl bg-info/10 flex items-center justify-center text-info shadow-lg shadow-blue-500/10 group-hover:rotate-6 transition-transform">
                            <Calendar size={32} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xl font-bold text-info block">تنبيه توريد الموردين</Label>
                            <p className="text-sm font-bold text-info/50 leading-relaxed">تذكير بموعد وصول الشحنات المنتظرة</p>
                        </div>
                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl">
                            <Input
                                type="number"
                                value={settings.supplierPaymentAlertDays || 0}
                                onChange={e => set({ supplierPaymentAlertDays: parseInt(e.target.value) || 0 })}
                                className="h-12 w-24 text-2xl font-bold text-center border-0 bg-transparent text-info"
                            />
                            <span className="font-bold text-info/30 uppercase text-xs tracking-[0.3em]">أيام</span>
                        </div>
                    </div>

                    <div className="group space-y-6 p-8 rounded-[2.5rem] bg-success/5 border border-success/10 hover:bg-success/10 transition-all duration-300">
                        <div className="h-16 w-16 rounded-2xl bg-success/20 flex items-center justify-center text-success shadow-lg shadow-success/10 group-hover:rotate-6 transition-transform">
                            <Users size={32} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xl font-bold text-success block">تنبيه تحصيل العملاء</Label>
                            <p className="text-sm font-bold text-success/50 leading-relaxed">تنبيه قبل حلول موعد استحقاق المديونية</p>
                        </div>
                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl">
                            <Input
                                type="number"
                                value={settings.customerCollectionAlertDays || 0}
                                onChange={e => set({ customerCollectionAlertDays: parseInt(e.target.value) || 0 })}
                                className="h-12 w-24 text-2xl font-bold text-center border-0 bg-transparent text-success"
                            />
                            <span className="font-bold text-success/30 uppercase text-xs tracking-[0.3em]">أيام</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
