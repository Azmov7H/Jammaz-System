'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Palette,
    QrCode,
    Image as ImageIcon,
    Sparkles
} from 'lucide-react';
import { TabHeader } from './TabHeader';

export function InvoiceDesignTab({ settings, onChange }) {
    const set = (patch) => onChange({ ...settings, ...patch });

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden h-fit">
                <div className="p-12">
                    <TabHeader
                        icon={Palette}
                        title="تخصيص الهوية البصرية"
                        description="اختر الألوان التي تميز علامتك التجارية في المطبوعات"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                        <div className="space-y-4 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
                            <Label className="text-xs font-bold text-white/20 uppercase tracking-[0.2em] block mb-2">اللون الأساسي للعلامة</Label>
                            <div className="flex gap-4 items-center">
                                <div
                                    className="w-16 h-16 rounded-2xl shadow-inner border-2 border-white/10 transition-transform hover:scale-105 duration-500"
                                    style={{ backgroundColor: settings.primaryColor }}
                                />
                                <div className="flex-1 space-y-2">
                                    <Input
                                        type="color"
                                        value={settings.primaryColor || '#3b82f6'}
                                        onChange={e => set({ primaryColor: e.target.value })}
                                        className="w-full h-8 p-0 border-0 bg-transparent cursor-pointer"
                                    />
                                    <Input
                                        value={settings.primaryColor || ''}
                                        onChange={e => set({ primaryColor: e.target.value })}
                                        className="font-bold text-sm h-10 uppercase text-center rounded-xl bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
                            <Label className="text-xs font-bold text-white/20 uppercase tracking-[0.2em] block mb-2">لون خلفية الترويسة</Label>
                            <div className="flex gap-4 items-center">
                                <div
                                    className="w-16 h-16 rounded-2xl shadow-inner border-2 border-white/10 transition-transform hover:scale-105 duration-500"
                                    style={{ backgroundColor: settings.headerBgColor }}
                                />
                                <div className="flex-1 space-y-2">
                                    <Input
                                        type="color"
                                        value={settings.headerBgColor || '#f8fafc'}
                                        onChange={e => set({ headerBgColor: e.target.value })}
                                        className="w-full h-8 p-0 border-0 bg-transparent cursor-pointer"
                                    />
                                    <Input
                                        value={settings.headerBgColor || ''}
                                        onChange={e => set({ headerBgColor: e.target.value })}
                                        className="font-bold text-sm h-10 uppercase text-center rounded-xl bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 space-y-6">
                        <div className="flex items-center justify-between p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                            <div className="space-y-1">
                                <Label className="text-lg font-bold flex items-center gap-2">
                                    <QrCode size={20} className="text-primary" /> تضمين رمز الاستجابة السريع (QR)
                                </Label>
                                <p className="text-sm font-bold text-white/20">يسمح بالتحقق الفوري من صحة الفاتورة</p>
                            </div>
                            <Switch
                                checked={settings.showQRCode}
                                onCheckedChange={checked => set({ showQRCode: checked })}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                        <div className="flex items-center justify-between p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                            <div className="space-y-1">
                                <Label className="text-lg font-bold flex items-center gap-2">
                                    <ImageIcon size={20} className="text-primary" /> عرض الشعار الرسمي
                                </Label>
                                <p className="text-sm font-bold text-white/20">إظهار شعار المؤسسة في المطبوعات</p>
                            </div>
                            <Switch
                                checked={settings.showLogo}
                                onCheckedChange={checked => set({ showLogo: checked })}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden h-fit">
                    <div className="p-8 border-b border-white/10 bg-white/[0.02]">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Palette size={20} className="text-primary" /> تذييل الفاتورة
                        </h3>
                    </div>
                    <div className="p-10">
                        <div className="space-y-4">
                            <Label className="text-xs font-bold text-white/20 uppercase tracking-[0.2em] mr-2">نص ختامي مخصص</Label>
                            <Textarea
                                value={settings.footerText || ''}
                                onChange={e => set({ footerText: e.target.value })}
                                className="w-full min-h-[160px] p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] text-lg font-bold focus-visible:ring-primary/30 transition-all resize-none placeholder:text-white/10"
                                placeholder="مثل: البضاعة المباعة لا ترد ولا تستبدل بعد 14 يوم..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-10 rounded-[2.5rem] bg-primary shadow-2xl shadow-primary/20 text-white space-y-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-150 transition-all duration-700"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <h4 className="font-bold text-2xl tracking-tightUppercase">معاينة النظام</h4>
                        <Sparkles className="animate-pulse" />
                    </div>
                    <p className="relative z-10 text-white/70 font-bold text-sm leading-relaxed">سيتم تطبيق هذه التغييرات على كافة الفواتير والتقارير الجديدة فور الضغط على حفظ التغييرات.</p>
                    <div className="relative z-10 pt-4 border-t border-white/20 mt-4 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-[0.3em] opacity-50">Transfer ERP v2.0</span>
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-primary bg-white/20 backdrop-blur-md" />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
