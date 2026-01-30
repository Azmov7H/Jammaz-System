"use client"
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Settings as SettingsIcon,
    Package,
    DollarSign,
    Users,
    Palette,
    CreditCard,
    QrCode,
    Loader2,
    Bell,
    Clock,
    Calendar,
    HandCoins,
    Settings2,
    Building2,
    Globe,
    Phone,
    Mail,
    MapPin,
    Check,
    Image as ImageIcon,
    Sparkles,
    TrendingUp,
    Zap,
    AlertTriangle,
    Plus,
    Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils';
import { PageHeader } from '@/components/ui/PageHeader';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [invoiceSettings, setInvoiceSettings] = useState({
        companyName: '',
        phone: '',
        additionalPhones: [],
        address: '',
        email: '',
        website: '',
        primaryColor: '#3b82f6',
        headerBgColor: '#f8fafc',
        showLogo: true,
        showQRCode: true,
        footerText: '',
        invoiceTemplate: 'modern',
        stockAlertThreshold: 5,
        supplierPaymentAlertDays: 3,
        customerCollectionAlertDays: 3,
        defaultCustomerTerms: 15,
        defaultSupplierTerms: 15,
        minDebtNotificationAmount: 10,
        inactiveCustomerThresholdDays: 30,
        pointsPerEGP: 0.01,
        egpPerPoint: 0.1
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/invoice-design');
                if (res.ok) {
                    const data = await res.json();
                    setInvoiceSettings(data);
                }
            } catch (error) {
                console.error('Error fetching invoice settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const handleSaveInvoiceSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/invoice-design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceSettings)
            });
            if (res.ok) {
                toast.success('تم حفظ الإعدادات بنجاح');
            } else {
                toast.error('فشل في حفظ الإعدادات');
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setLoading(false);
        }
    };

    const TabHeader = ({ icon: Icon, title, description }) => (
        <div className="flex flex-col gap-2 mb-8 animate-fade-in-up">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-black tracking-tight uppercase tracking-widest">{title}</h2>
            </div>
            <p className="text-sm font-bold text-white/30 mr-[3.5rem] italic">{description}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a]/20 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            {/* Page Header */}
            <PageHeader
                title="الإعدادات"
                subtitle="تحكم في هوية مؤسستك وقواعد النظام والسياسات المالية"
                icon={SettingsIcon}
                actions={
                    <Button
                        onClick={handleSaveInvoiceSettings}
                        disabled={loading}
                        className="h-14 px-8 rounded-2xl font-black text-lg gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 transition-all active:scale-95 group"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin ml-2" />
                        ) : (
                            <Check className="w-6 h-6 ml-2 group-hover:scale-125 transition-transform" />
                        )}
                        حفظ كافة التغييرات
                    </Button>
                }
            />

            <Tabs defaultValue="general" className="w-full max-w-6xl mx-auto" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-2 bg-white/[0.02] border border-white/5 rounded-[2rem] glass-card mb-12 shadow-2xl">
                    <TabsTrigger value="general" className="rounded-2xl py-4 font-black transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl shadow-primary/20">
                        <Building2 className="w-5 h-5 ml-2" /> البيانات العامة
                    </TabsTrigger>
                    <TabsTrigger value="design" className="rounded-2xl py-4 font-black transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl shadow-primary/20">
                        <Palette className="w-5 h-5 ml-2" /> هوية الفاتورة
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="rounded-2xl py-4 font-black transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl shadow-primary/20">
                        <Bell className="w-5 h-5 ml-2" /> التنبيهات
                    </TabsTrigger>
                    <TabsTrigger value="growth" className="rounded-2xl py-4 font-black transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl shadow-primary/20">
                        <Sparkles className="w-5 h-5 ml-2" /> النمو والولاء
                    </TabsTrigger>
                    <TabsTrigger value="defaults" className="rounded-2xl py-4 font-black transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl shadow-primary/20">
                        <Settings2 className="w-5 h-5 ml-2" /> القيم الافتراضية
                    </TabsTrigger>
                </TabsList>

                {/* General Settings Tab */}
                <TabsContent value="general">
                    <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                        <div className="p-12">
                            <TabHeader
                                icon={Building2}
                                title="بيانات المؤسسة"
                                description="تظهر هذه البيانات في ترويسة الفاتورة والتقارير الرسمية"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        <Users size={14} className="text-primary" /> اسم المؤسسة
                                    </Label>
                                    <Input
                                        value={invoiceSettings.companyName || ''}
                                        onChange={e => setInvoiceSettings({ ...invoiceSettings, companyName: e.target.value })}
                                        className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all rounded-xl shadow-sm"
                                        placeholder="اسم شركتك أو مخزنك"
                                    />
                                </div>
                                <div className="space-y-3 md:col-span-1">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        <Phone size={14} className="text-primary" /> أرقام الهاتف
                                    </Label>
                                    <div className="space-y-2">
                                        {/* Primary Phone */}
                                        <div className="relative">
                                            <Input
                                                value={invoiceSettings.phone || ''}
                                                onChange={e => setInvoiceSettings({ ...invoiceSettings, phone: e.target.value })}
                                                className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all rounded-xl shadow-sm pl-20"
                                                placeholder="رقم الهاتف الأساسي"
                                            />
                                            <span className="absolute left-3 top-3 text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">أساسي</span>
                                        </div>

                                        {/* Additional Phones */}
                                        {invoiceSettings.additionalPhones?.map((phone, idx) => (
                                            <div key={idx} className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                                                <Input
                                                    value={phone}
                                                    onChange={e => {
                                                        const newPhones = [...(invoiceSettings.additionalPhones || [])];
                                                        newPhones[idx] = e.target.value;
                                                        setInvoiceSettings({ ...invoiceSettings, additionalPhones: newPhones });
                                                    }}
                                                    className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all rounded-xl shadow-sm"
                                                    placeholder="رقم إضافي..."
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const newPhones = invoiceSettings.additionalPhones.filter((_, i) => i !== idx);
                                                        setInvoiceSettings({ ...invoiceSettings, additionalPhones: newPhones });
                                                    }}
                                                    className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700"
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        ))}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setInvoiceSettings({
                                                ...invoiceSettings,
                                                additionalPhones: [...(invoiceSettings.additionalPhones || []), '']
                                            })}
                                            className="w-full h-10 border-dashed border-primary/30 text-primary hover:bg-primary/5 rounded-xl gap-2"
                                        >
                                            <Plus size={16} /> إضافة رقم آخر
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        <Mail size={14} className="text-primary" /> البريد الإلكتروني
                                    </Label>
                                    <Input
                                        value={invoiceSettings.email || ''}
                                        onChange={e => setInvoiceSettings({ ...invoiceSettings, email: e.target.value })}
                                        className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all rounded-xl shadow-sm"
                                        placeholder="info@example.com"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        <Globe size={14} className="text-primary" /> الموقع الإلكتروني
                                    </Label>
                                    <Input
                                        value={invoiceSettings.website || ''}
                                        onChange={e => setInvoiceSettings({ ...invoiceSettings, website: e.target.value })}
                                        className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all rounded-xl shadow-sm"
                                        placeholder="www.example.com"
                                    />
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        <MapPin size={14} className="text-primary" /> العنوان بالكامل
                                    </Label>
                                    <Input
                                        value={invoiceSettings.address || ''}
                                        onChange={e => setInvoiceSettings({ ...invoiceSettings, address: e.target.value })}
                                        className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all rounded-xl shadow-sm"
                                        placeholder="القاهرة، مدينة نصر، شارع..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Identity & Design Tab */}
                <TabsContent value="design">
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
                                        <Label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">اللون الأساسي للعلامة</Label>
                                        <div className="flex gap-4 items-center">
                                            <div
                                                className="w-16 h-16 rounded-2xl shadow-inner border-2 border-white/10 transition-transform hover:scale-105 duration-500"
                                                style={{ backgroundColor: invoiceSettings.primaryColor }}
                                            />
                                            <div className="flex-1 space-y-2">
                                                <Input
                                                    type="color"
                                                    value={invoiceSettings.primaryColor || '#3b82f6'}
                                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, primaryColor: e.target.value })}
                                                    className="w-full h-8 p-0 border-0 bg-transparent cursor-pointer"
                                                />
                                                <Input
                                                    value={invoiceSettings.primaryColor || ''}
                                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, primaryColor: e.target.value })}
                                                    className="font-black text-sm h-10 uppercase text-center rounded-xl bg-white/5 border-white/10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
                                        <Label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">لون خلفية الترويسة</Label>
                                        <div className="flex gap-4 items-center">
                                            <div
                                                className="w-16 h-16 rounded-2xl shadow-inner border-2 border-white/10 transition-transform hover:scale-105 duration-500"
                                                style={{ backgroundColor: invoiceSettings.headerBgColor }}
                                            />
                                            <div className="flex-1 space-y-2">
                                                <Input
                                                    type="color"
                                                    value={invoiceSettings.headerBgColor || '#f8fafc'}
                                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, headerBgColor: e.target.value })}
                                                    className="w-full h-8 p-0 border-0 bg-transparent cursor-pointer"
                                                />
                                                <Input
                                                    value={invoiceSettings.headerBgColor || ''}
                                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, headerBgColor: e.target.value })}
                                                    className="font-black text-sm h-10 uppercase text-center rounded-xl bg-white/5 border-white/10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 space-y-6">
                                    <div className="flex items-center justify-between p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                        <div className="space-y-1">
                                            <Label className="text-lg font-black flex items-center gap-2">
                                                <QrCode size={20} className="text-primary" /> تضمين رمز الاستجابة السريع (QR)
                                            </Label>
                                            <p className="text-sm font-bold text-white/20">يسمح بالتحقق الفوري من صحة الفاتورة</p>
                                        </div>
                                        <Switch
                                            checked={invoiceSettings.showQRCode}
                                            onCheckedChange={checked => setInvoiceSettings({ ...invoiceSettings, showQRCode: checked })}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                        <div className="space-y-1">
                                            <Label className="text-lg font-black flex items-center gap-2">
                                                <ImageIcon size={20} className="text-primary" /> عرض الشعار الرسمي
                                            </Label>
                                            <p className="text-sm font-bold text-white/20">إظهار شعار المؤسسة في المطبوعات</p>
                                        </div>
                                        <Switch
                                            checked={invoiceSettings.showLogo}
                                            onCheckedChange={checked => setInvoiceSettings({ ...invoiceSettings, showLogo: checked })}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden h-fit">
                                <div className="p-8 border-b border-white/10 bg-white/[0.02]">
                                    <h3 className="text-xl font-black flex items-center gap-2">
                                        <Palette size={20} className="text-primary" /> تذييل الفاتورة
                                    </h3>
                                </div>
                                <div className="p-10">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mr-2">نص ختامي مخصص</Label>
                                        <textarea
                                            value={invoiceSettings.footerText || ''}
                                            onChange={e => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
                                            className="w-full min-h-[160px] p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] text-lg font-bold focus:ring-0 outline-none transition-all resize-none ring-0 placeholder:text-white/10"
                                            placeholder="مثل: البضاعة المباعة لا ترد ولا تستبدل بعد 14 يوم..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 rounded-[2.5rem] bg-primary shadow-2xl shadow-primary/20 text-white space-y-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-150 transition-all duration-700"></div>
                                <div className="relative z-10 flex items-center justify-between">
                                    <h4 className="font-black text-2xl tracking-tighterUppercase">معاينة النظام</h4>
                                    <Sparkles className="animate-pulse" />
                                </div>
                                <p className="relative z-10 text-white/70 font-bold text-sm leading-relaxed">سيتم تطبيق هذه التغييرات على كافة الفواتير والتقارير الجديدة فور الضغط على حفظ التغييرات.</p>
                                <div className="relative z-10 pt-4 border-t border-white/20 mt-4 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Transfer ERP v2.0</span>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-primary bg-white/20 backdrop-blur-md" />)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="alerts">
                    <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                        <div className="p-12">
                            <TabHeader
                                icon={Bell}
                                title="إشعارات النظام الذكية"
                                description="إدارة حدود المخزون وتذكيرات السداد التلقائي"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                                <div className="group space-y-6 p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-all duration-300">
                                    <div className="h-16 w-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10 group-hover:rotate-6 transition-transform">
                                        <Package size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xl font-black text-amber-100 block">حد المخزون الحرج</Label>
                                        <p className="text-sm font-bold text-amber-500/50 leading-relaxed">أقل كمية للمنتج قبل إطلاق تنبيه "نقص المخزون"</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl">
                                        <Input
                                            type="number"
                                            value={invoiceSettings.stockAlertThreshold || 0}
                                            onChange={e => setInvoiceSettings({ ...invoiceSettings, stockAlertThreshold: parseInt(e.target.value) || 0 })}
                                            className="h-12 w-24 text-2xl font-black text-center border-0 bg-transparent text-amber-500 ring-0 focus-visible:ring-0"
                                        />
                                        <span className="font-black text-amber-500/30 uppercase text-xs tracking-[0.3em]">وحدة</span>
                                    </div>
                                </div>

                                <div className="group space-y-6 p-8 rounded-[2.5rem] bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all duration-300">
                                    <div className="h-16 w-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/10 group-hover:rotate-6 transition-transform">
                                        <Calendar size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xl font-black text-blue-100 block">تنبيه توريد الموردين</Label>
                                        <p className="text-sm font-bold text-blue-500/50 leading-relaxed">تذكير بموعد وصول الشحنات المنتظرة</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl">
                                        <Input
                                            type="number"
                                            value={invoiceSettings.supplierPaymentAlertDays || 0}
                                            onChange={e => setInvoiceSettings({ ...invoiceSettings, supplierPaymentAlertDays: parseInt(e.target.value) || 0 })}
                                            className="h-12 w-24 text-2xl font-black text-center border-0 bg-transparent text-blue-500 ring-0 focus-visible:ring-0"
                                        />
                                        <span className="font-black text-blue-500/30 uppercase text-xs tracking-[0.3em]">أيام</span>
                                    </div>
                                </div>

                                <div className="group space-y-6 p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all duration-300">
                                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10 group-hover:rotate-6 transition-transform">
                                        <Users size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xl font-black text-emerald-100 block">تنبيه تحصيل العملاء</Label>
                                        <p className="text-sm font-bold text-emerald-500/50 leading-relaxed">تنبيه قبل حلول موعد استحقاق المديونية</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl">
                                        <Input
                                            type="number"
                                            value={invoiceSettings.customerCollectionAlertDays || 0}
                                            onChange={e => setInvoiceSettings({ ...invoiceSettings, customerCollectionAlertDays: parseInt(e.target.value) || 0 })}
                                            className="h-12 w-24 text-2xl font-black text-center border-0 bg-transparent text-emerald-500 ring-0 focus-visible:ring-0"
                                        />
                                        <span className="font-black text-emerald-500/30 uppercase text-xs tracking-[0.3em]">أيام</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Smart Growth & Loyalty Tab */}
                <TabsContent value="growth">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                        <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden">
                            <div className="p-10">
                                <TabHeader
                                    icon={Sparkles}
                                    title="نظام ولاء العملاء"
                                    description="إدارة كيفية اكتساب واستبدال النقاط"
                                />

                                <div className="space-y-8 mt-10">
                                    <div className="group space-y-6 p-8 rounded-[2.5rem] bg-amber-500/5 border border-white/5 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xl font-black text-amber-100 italic">معدل الاكتساب</Label>
                                            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
                                                <Zap size={24} className="animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                                            <span className="text-sm font-bold text-white/20 w-24">نقطة لكل</span>
                                            <Input
                                                type="number"
                                                value={1 / (invoiceSettings.pointsPerEGP || 0.01)}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 100;
                                                    setInvoiceSettings({ ...invoiceSettings, pointsPerEGP: 1 / val });
                                                }}
                                                className="h-14 text-3xl font-black text-center border-0 bg-transparent text-white ring-0 focus-visible:ring-0 tabular-nums"
                                            />
                                            <span className="font-black text-white/40 uppercase text-xs tracking-[0.3em]">ج.م</span>
                                        </div>
                                        <p className="text-[11px] text-white/20 font-bold leading-relaxed px-2">ملاحظة: تفعيل خيار "نقطة لكل 100 ج.م" يعني أن كل 100 جنيه عُملة فاتورة تمنح العميل نقطة واحدة.</p>
                                    </div>

                                    <div className="group space-y-6 p-8 rounded-[2.5rem] bg-emerald-500/5 border border-white/5 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xl font-black text-emerald-100 italic">قيمة الاستبدال</Label>
                                            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
                                                <TrendingUp size={24} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                                            <span className="text-sm font-bold text-white/20 w-24">النقطة تساوي</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={invoiceSettings.egpPerPoint || 0.1}
                                                onChange={e => setInvoiceSettings({ ...invoiceSettings, egpPerPoint: parseFloat(e.target.value) || 0 })}
                                                className="h-14 text-3xl font-black text-center border-0 bg-transparent text-white ring-0 focus-visible:ring-0 tabular-nums"
                                            />
                                            <span className="font-black text-white/40 uppercase text-xs tracking-[0.3em]">ج.م</span>
                                        </div>
                                        <p className="text-[11px] text-white/20 font-bold leading-relaxed px-2">القيمة النقدية التي سيتم تحويلها من رصيد النقاط إلى رصيد المحفظة.</p>
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
                                    <div className="group space-y-6 p-10 rounded-[2.5rem] bg-rose-500/5 border border-white/5 shadow-inner relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/5 rounded-full -ml-16 -mt-16 blur-2xl" />
                                        <div className="flex items-center justify-between relative z-10">
                                            <Label className="text-xl font-black text-rose-100">فترة الانقطاع الحرجة</Label>
                                            <Clock size={28} className="text-rose-500 animate-pulse" />
                                        </div>
                                        <div className="flex items-center gap-4 bg-black/20 p-8 rounded-[2rem] border border-white/5 relative z-10">
                                            <Input
                                                type="number"
                                                value={invoiceSettings.inactiveCustomerThresholdDays || 30}
                                                onChange={e => setInvoiceSettings({ ...invoiceSettings, inactiveCustomerThresholdDays: parseInt(e.target.value) || 0 })}
                                                className="h-16 text-4xl font-black text-center border-0 bg-transparent text-rose-500 ring-0 focus-visible:ring-0"
                                            />
                                            <span className="font-black text-rose-500/30 uppercase text-xs tracking-[0.5em]">يوم</span>
                                        </div>
                                        <p className="text-sm text-white/20 font-bold leading-relaxed px-2 relative z-10">سيتم تظليل أسماء العملاء باللون الأحمر في القوائم إذا لم يتم الشراء خلال هذه المدة.</p>
                                    </div>

                                    <div className="p-10 rounded-[2.5rem] bg-primary/10 border border-dashed border-primary/30 space-y-4">
                                        <div className="flex items-center gap-3 text-primary font-black text-lg">
                                            <Zap size={24} className="fill-current" /> معلومة ذكية
                                        </div>
                                        <p className="text-sm leading-relaxed text-white/40 font-bold">
                                            يتم تذكيرك تلقائياً في صفحة "الإشعارات" عند وصول العميل لهذا الحد، مما يساعدك على التواصل معهم وتقديم عروض تحفيزية لاستعادة نشاطهم.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Defaults & Debt Tab */}
                <TabsContent value="defaults">
                    <div className="glass-card shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/10 rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-700">
                        <div className="p-12">
                            <TabHeader
                                icon={Settings2}
                                title="القيم الافتراضية والتحكم"
                                description="قواعد العمل التلقائية للديون والتحصيلات"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-10">
                                <div className="space-y-10">
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                            <CreditCard size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black tracking-tight">فترات السداد الآلي</h4>
                                            <p className="text-sm font-bold text-white/20">تُطبق تلقائياً عند إنشاء الفواتير والمشتريات</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8 pr-6 border-r-4 border-white/5">
                                        <div className="space-y-4 group">
                                            <Label className="text-sm font-black text-white/30 uppercase tracking-[0.2em] flex items-center justify-between">
                                                استحقاق العميل (المبيعات)
                                                <span className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full">STANDARD TERMS</span>
                                            </Label>
                                            <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 group-hover:bg-white/[0.05] transition-all">
                                                <Input
                                                    type="number"
                                                    value={invoiceSettings.defaultCustomerTerms || 0}
                                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, defaultCustomerTerms: parseInt(e.target.value) || 0 })}
                                                    className="h-10 text-3xl font-black border-0 bg-transparent text-white ring-0 focus-visible:ring-0 tabular-nums text-center"
                                                />
                                                <span className="text-xs font-black text-white/10 uppercase tracking-widest">يوم</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 group">
                                            <Label className="text-sm font-black text-white/30 uppercase tracking-[0.2em] flex items-center justify-between">
                                                موعد التوريد (المشتريات)
                                                <span className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full">EXPECTED DELIVERY</span>
                                            </Label>
                                            <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 group-hover:bg-white/[0.05] transition-all">
                                                <Input
                                                    type="number"
                                                    value={invoiceSettings.defaultSupplierTerms || 0}
                                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, defaultSupplierTerms: parseInt(e.target.value) || 0 })}
                                                    className="h-10 text-3xl font-black border-0 bg-transparent text-white ring-0 focus-visible:ring-0 tabular-nums text-center"
                                                />
                                                <span className="text-xs font-black text-white/10 uppercase tracking-widest">يوم</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                                            <HandCoins size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black tracking-tight">إدارة مبالغ التنبيه</h4>
                                            <p className="text-sm font-bold text-white/20">تصفية التنبيهات الصغيرة لزيادة الفعالية</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8 pr-6 border-r-4 border-amber-500/10">
                                        <div className="space-y-4">
                                            <Label className="text-sm font-black text-amber-500/40 uppercase tracking-[0.2em]">الحد الأدنى لقيمة التنبيه</Label>
                                            <div className="relative group">
                                                <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500/20 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-500 animate-pulse w-[30%]" />
                                                </div>
                                                <div className="flex items-center gap-4 bg-amber-500/5 p-8 rounded-[2.5rem] border border-amber-500/10 transition-all">
                                                    <Input
                                                        type="number"
                                                        value={invoiceSettings.minDebtNotificationAmount || 0}
                                                        onChange={e => setInvoiceSettings({ ...invoiceSettings, minDebtNotificationAmount: parseInt(e.target.value) || 0 })}
                                                        className="h-12 text-5xl font-black text-center border-0 bg-transparent text-amber-500 ring-0 focus-visible:ring-0 tabular-nums"
                                                    />
                                                    <span className="text-xl font-black text-amber-500/20">ج.م</span>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-white/20 font-bold leading-relaxed pr-2 italic">
                                                سيتم تجاهل أي مديونية أقل من هذا المبلغ في قائمة الإشعارات السريعة.
                                            </p>
                                        </div>

                                        <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-dashed border-white/10 flex items-start gap-4">
                                            <div className="h-3 w-3 rounded-full bg-amber-500 mt-1 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                            <p className="text-xs font-bold leading-relaxed text-white/30">
                                                تلميح: ربط وسيلة الدفع بالنظام يسمح بحساب صافي الربح بدقة متناهية بناءً على التكاليف المدخلة أعلاه.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    );
}
