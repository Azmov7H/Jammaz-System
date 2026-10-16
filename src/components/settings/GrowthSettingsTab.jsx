'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sparkles,
    TrendingUp,
    Zap,
    AlertTriangle,
    Clock
} from 'lucide-react';
import { TabHeader } from './TabHeader';

export function GrowthSettingsTab({ settings, onChange }) {
    const set = (patch) => onChange({ ...settings, ...patch });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden">
                <div className="p-10">
                    <TabHeader
                        icon={Sparkles}
                        title="نظام ولاء العملاء"
                        description="إدارة كيفية اكتساب واستبدال النقاط"
                    />

                    <div className="space-y-8 mt-10">
                        <div className="group space-y-6 p-8 rounded-[2.5rem] bg-warning/5 border border-white/5 shadow-inner">
                            <div className="flex items-center justify-between">
                                <Label className="text-xl font-bold text-warning italic">معدل الاكتساب</Label>
                                <div className="w-12 h-12 bg-warning/20 rounded-2xl flex items-center justify-center text-warning shadow-lg shadow-warning/10">
                                    <Zap size={24} className="animate-pulse" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                                <span className="text-sm font-bold text-white/20 w-24">نقطة لكل</span>
                                <Input
                                    type="number"
                                    value={1 / (settings.pointsPerEGP || 0.01)}
                                    onChange={e => {
                                        const val = parseFloat(e.target.value) || 100;
                                        set({ pointsPerEGP: 1 / val });
                                    }}
                                    className="h-14 text-3xl font-bold text-center border-0 bg-transparent text-white tabular-nums"
                                />
                                <span className="font-bold text-white/40 uppercase text-xs tracking-[0.3em]">ج.م</span>
                            </div>
                            <p className="text-xs text-white/20 font-bold leading-relaxed px-2">ملاحظة: تفعيل خيار &quot;نقطة لكل 100 ج.م&quot; يعني أن كل 100 جنيه عُملة فاتورة تمنح العميل نقطة واحدة.</p>
                        </div>

                        <div className="group space-y-6 p-8 rounded-[2.5rem] bg-success/5 border border-white/5 shadow-inner">
                            <div className="flex items-center justify-between">
                                <Label className="text-xl font-bold text-success italic">قيمة الاستبدال</Label>
                                <div className="w-12 h-12 bg-success/20 rounded-2xl flex items-center justify-center text-success shadow-lg shadow-success/10">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                                <span className="text-sm font-bold text-white/20 w-24">النقطة تساوي</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={settings.egpPerPoint || 0.1}
                                    onChange={e => set({ egpPerPoint: parseFloat(e.target.value) || 0 })}
                                    className="h-14 text-3xl font-bold text-center border-0 bg-transparent text-white tabular-nums"
                                />
                                <span className="font-bold text-white/40 uppercase text-xs tracking-[0.3em]">ج.م</span>
                            </div>
                            <p className="text-xs text-white/20 font-bold leading-relaxed px-2">القيمة النقدية التي سيتم تحويلها من رصيد النقاط إلى رصيد المحفظة.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden">
                <div className="p-10">
                    <TabHeader
                        icon={AlertTriangle}
                        title="تنبيهات انقطاع العملاء"
                        description="إعادة جذب العملاء الذين لم يشتروا منذ فترة"
                    />

                    <div className="space-y-8 mt-10">
                        <div className="group space-y-6 p-10 rounded-[2.5rem] bg-destructive/5 border border-white/5 shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-destructive/5 rounded-full -ml-16 -mt-16 blur-2xl" />
                            <div className="flex items-center justify-between relative z-10">
                                <Label className="text-xl font-bold text-destructive">فترة الانقطاع الحرجة</Label>
                                <Clock size={28} className="text-destructive animate-pulse" />
                            </div>
                            <div className="flex items-center gap-4 bg-black/20 p-8 rounded-[2rem] border border-white/5 relative z-10">
                                <Input
                                    type="number"
                                    value={settings.inactiveCustomerThresholdDays || 30}
                                    onChange={e => set({ inactiveCustomerThresholdDays: parseInt(e.target.value) || 0 })}
                                    className="h-16 text-4xl font-bold text-center border-0 bg-transparent text-destructive"
                                />
                                <span className="font-bold text-destructive/30 uppercase text-xs tracking-[0.5em]">يوم</span>
                            </div>
                            <p className="text-sm text-white/20 font-bold leading-relaxed px-2 relative z-10">سيتم تظليل أسماء العملاء باللون الأحمر في القوائم إذا لم يتم الشراء خلال هذه المدة.</p>
                        </div>

                        <div className="p-10 rounded-[2.5rem] bg-primary/10 border border-dashed border-primary/30 space-y-4">
                            <div className="flex items-center gap-3 text-primary font-bold text-lg">
                                <Zap size={24} className="fill-current" /> معلومة ذكية
                            </div>
                            <p className="text-sm leading-relaxed text-white/40 font-bold">
                                يتم تذكيرك تلقائياً في صفحة &quot;الإشعارات&quot; عند وصول العميل لهذا الحد، مما يساعدك على التواصل معهم وتقديم عروض تحفيزية لاستعادة نشاطهم.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
