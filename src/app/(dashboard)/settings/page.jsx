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
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [invoiceSettings, setInvoiceSettings] = useState({
        companyName: '',
        phone: '',
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
        <div className="flex flex-col gap-1 mb-6 animate-fade-in-up">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{title}</h2>
            </div>
            <p className="text-sm text-muted-foreground mr-9">{description}</p>
        </div>
    );

    return (
        <div className="container max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg transform -rotate-3">
                        <SettingsIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">الإعدادات</h1>
                        <p className="text-muted-foreground font-medium">تحكم في هوية مؤسستك وقواعد النظام</p>
                    </div>
                </div>
                <Button
                    onClick={handleSaveInvoiceSettings}
                    disabled={loading}
                    className="gradient-primary border-0 shadow-lg hover-scale group h-11 px-6 text-white"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : (
                        <Check className="w-4 h-4 ml-2 group-hover:scale-125 transition-transform" />
                    )}
                    حفظ كافة التغييرات
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/50 rounded-2xl glass-card mb-8">
                    <TabsTrigger value="general" className="rounded-xl py-3 data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                        <Building2 className="w-4 h-4 ml-2" /> البيانات العامة
                    </TabsTrigger>
                    <TabsTrigger value="design" className="rounded-xl py-3 data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                        <Palette className="w-4 h-4 ml-2" /> هوية الفاتورة
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="rounded-xl py-3 data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                        <Bell className="w-4 h-4 ml-2" /> التنبيهات والأمان
                    </TabsTrigger>
                    <TabsTrigger value="growth" className="rounded-xl py-3 data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                        <Sparkles className="w-4 h-4 ml-2" /> النمو والولاء
                    </TabsTrigger>
                    <TabsTrigger value="defaults" className="rounded-xl py-3 data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                        <Settings2 className="w-4 h-4 ml-2" /> القيم الافتراضية
                    </TabsTrigger>
                </TabsList>

                {/* General Settings Tab */}
                <TabsContent value="general">
                    <Card className="glass-card border-0 shadow-custom-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <CardContent className="p-8">
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
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        <Phone size={14} className="text-primary" /> الهاتف
                                    </Label>
                                    <Input
                                        value={invoiceSettings.phone || ''}
                                        onChange={e => setInvoiceSettings({ ...invoiceSettings, phone: e.target.value })}
                                        className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all rounded-xl shadow-sm"
                                        placeholder="+20 xxx xxx xxxx"
                                    />
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
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Identity & Design Tab */}
                <TabsContent value="design">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="glass-card border-0 shadow-lg md:col-span-2 h-fit">
                            <CardContent className="p-8">
                                <TabHeader
                                    icon={Palette}
                                    title="تخصيص الهوية البصرية"
                                    description="اختر الألوان التي تميز علامتك التجارية في المطبوعات"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                    <div className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-muted-foreground/5">
                                        <Label className="text-sm font-bold block mb-2">اللون الأساسي للعلامة</Label>
                                        <div className="flex gap-3 items-center">
                                            <div
                                                className="w-14 h-14 rounded-xl shadow-inner border-2 border-white"
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
                                                    className="font-mono text-xs h-9 uppercase text-center rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-muted-foreground/5">
                                        <Label className="text-sm font-bold block mb-2">لون خلفية الترويسة</Label>
                                        <div className="flex gap-3 items-center">
                                            <div
                                                className="w-14 h-14 rounded-xl shadow-inner border-2 border-white"
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
                                                    className="font-mono text-xs h-9 uppercase text-center rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-bold flex items-center gap-2">
                                                <QrCode size={16} className="text-primary" /> تضمين رمز الاستجابة السريع (QR)
                                            </Label>
                                            <p className="text-xs text-muted-foreground">يسمح بالتحقق الفوري من صحة الفاتورة</p>
                                        </div>
                                        <Switch
                                            checked={invoiceSettings.showQRCode}
                                            onCheckedChange={checked => setInvoiceSettings({ ...invoiceSettings, showQRCode: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-bold flex items-center gap-2">
                                                <ImageIcon size={16} className="text-primary" /> عرض الشعار الرسمي
                                            </Label>
                                            <p className="text-xs text-muted-foreground">إظهار شعار المؤسسة المرفوع في النظام</p>
                                        </div>
                                        <Switch
                                            checked={invoiceSettings.showLogo}
                                            onCheckedChange={checked => setInvoiceSettings({ ...invoiceSettings, showLogo: checked })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="glass-card border-0 shadow-lg h-fit overflow-hidden">
                                <CardHeader className="bg-primary/10 border-b-0 pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Palette size={14} className="text-primary" /> تذييل الفاتورة
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">نص ختامي مخصص</Label>
                                        <textarea
                                            value={invoiceSettings.footerText || ''}
                                            onChange={e => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
                                            className="w-full min-h-[120px] p-4 bg-muted/30 border border-muted-foreground/10 rounded-2xl text-sm focus:ring-2 ring-primary/20 outline-none transition-all resize-none"
                                            placeholder="مثل: البضاعة المباعة لا ترد ولا تستبدل بعد 14 يوم..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="p-6 rounded-3xl gradient-primary text-white space-y-2 shadow-custom-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                                <h4 className="font-black text-lg">معاينة مباشرة</h4>
                                <p className="text-white/80 text-xs leading-relaxed font-medium">سيتم تطبيق هذه التغييرات على كافة الفواتير الجديدة فور الحفظ.</p>
                                <div className="pt-2 border-t border-white/20 mt-4 flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">v2.5 Design</span>
                                    <Palette size={18} className="animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="alerts">
                    <Card className="glass-card border-0 shadow-custom-xl animate-in slide-in-from-bottom-4 duration-500">
                        <CardContent className="p-8">
                            <TabHeader
                                icon={Bell}
                                title="إشعارات النظام الذكية"
                                description="إدارة حدود المخزون وتذكيرات السداد التلقائي"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                                <div className="group space-y-4 p-6 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-all duration-300">
                                    <div className="h-14 w-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                                        <Package size={28} />
                                    </div>
                                    <Label className="text-base font-bold text-amber-900 block">حد المخزون الحرج</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={invoiceSettings.stockAlertThreshold || 0}
                                            onChange={e => setInvoiceSettings({ ...invoiceSettings, stockAlertThreshold: parseInt(e.target.value) || 0 })}
                                            className="h-12 text-lg font-black text-center border-amber-500/20 bg-white/50 rounded-2xl"
                                        />
                                        <span className="font-bold text-amber-700/60 uppercase text-xs tracking-widest">وحدة</span>
                                    </div>
                                    <p className="text-xs text-amber-800/70 font-medium leading-relaxed">
                                        أقل كمية للمنتج قبل إطلاق تنبيه "نقص المخزون" في الصفحة الرئيسية.
                                    </p>
                                </div>

                                <div className="group space-y-4 p-6 rounded-[2.5rem] bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all duration-300">
                                    <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                                        <Calendar size={28} />
                                    </div>
                                    <Label className="text-base font-bold text-blue-900 block">تنبيه توريد الموردين</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={invoiceSettings.supplierPaymentAlertDays || 0}
                                            onChange={e => setInvoiceSettings({ ...invoiceSettings, supplierPaymentAlertDays: parseInt(e.target.value) || 0 })}
                                            className="h-12 text-lg font-black text-center border-blue-500/20 bg-white/50 rounded-2xl"
                                        />
                                        <span className="font-bold text-blue-700/60 uppercase text-xs tracking-widest">أيام</span>
                                    </div>
                                    <p className="text-xs text-blue-800/70 font-medium leading-relaxed">
                                        عدد الأيام المتبقية على موعد وصول الشحنة لإرسال تنبيه تذكيري.
                                    </p>
                                </div>

                                <div className="group space-y-4 p-6 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all duration-300">
                                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                                        <Users size={28} />
                                    </div>
                                    <Label className="text-base font-bold text-emerald-900 block">تنبيه تحصيل العملاء</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={invoiceSettings.customerCollectionAlertDays || 0}
                                            onChange={e => setInvoiceSettings({ ...invoiceSettings, customerCollectionAlertDays: parseInt(e.target.value) || 0 })}
                                            className="h-12 text-lg font-black text-center border-emerald-500/20 bg-white/50 rounded-2xl"
                                        />
                                        <span className="font-bold text-emerald-700/60 uppercase text-xs tracking-widest">أيام</span>
                                    </div>
                                    <p className="text-xs text-emerald-800/70 font-medium leading-relaxed">
                                        تنبيهك قبل حلول موعد استحقاق مديونية العميل للبدء في إجراءات التحصيل.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Smart Growth & Loyalty Tab */}
                <TabsContent value="growth">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                        <Card className="glass-card border-0 shadow-custom-xl overflow-hidden rounded-[2rem]">
                            <CardContent className="p-8">
                                <TabHeader
                                    icon={Sparkles}
                                    title="نظام ولاء العملاء"
                                    description="إدارة كيفية اكتساب واستبدال النقاط"
                                />

                                <div className="space-y-8 mt-6">
                                    <div className="group space-y-4 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-base font-bold text-amber-900">معدل الاكتساب</Label>
                                            <Zap size={20} className="text-amber-500 animate-pulse" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-muted-foreground w-20">نقطة لكل</span>
                                            <Input
                                                type="number"
                                                value={1 / (invoiceSettings.pointsPerEGP || 0.01)}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 100;
                                                    setInvoiceSettings({ ...invoiceSettings, pointsPerEGP: 1 / val });
                                                }}
                                                className="h-12 text-lg font-black text-center border-amber-500/20 bg-white/50 rounded-2xl"
                                            />
                                            <span className="font-bold text-amber-700/60 uppercase text-xs tracking-widest">ج.م</span>
                                        </div>
                                        <p className="text-[10px] text-amber-800/70 font-medium leading-relaxed">
                                            على سبيل المثال: القيمة 100 تعني أن العميل يحصل على نقطة واحدة مقابل كل 100 جنيه من قيمة الفاتورة.
                                        </p>
                                    </div>

                                    <div className="group space-y-4 p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-base font-bold text-emerald-900">قيمة الاستبدال</Label>
                                            <TrendingUp size={20} className="text-emerald-500" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-muted-foreground w-20">النقطة تساوي</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={invoiceSettings.egpPerPoint || 0.1}
                                                onChange={e => setInvoiceSettings({ ...invoiceSettings, egpPerPoint: parseFloat(e.target.value) || 0 })}
                                                className="h-12 text-lg font-black text-center border-emerald-500/20 bg-white/50 rounded-2xl"
                                            />
                                            <span className="font-bold text-emerald-700/60 uppercase text-xs tracking-widest">ج.م</span>
                                        </div>
                                        <p className="text-[10px] text-emerald-800/70 font-medium leading-relaxed">
                                            القيمة النقدية التي سيتم إضافتها لرصيد العميل مقابل كل نقطة ولاء يستبدلها.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-card border-0 shadow-custom-xl overflow-hidden rounded-[2rem]">
                            <CardContent className="p-8">
                                <TabHeader
                                    icon={AlertTriangle}
                                    title="تنبيهات انقطاع العملاء"
                                    description="إعادة جذب العملاء الذين لم يشتروا منذ فترة"
                                />

                                <div className="space-y-8 mt-6">
                                    <div className="group space-y-4 p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-base font-bold text-rose-900">فترة الانقطاع الحرجة</Label>
                                            <Clock size={20} className="text-rose-500" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="number"
                                                value={invoiceSettings.inactiveCustomerThresholdDays || 30}
                                                onChange={e => setInvoiceSettings({ ...invoiceSettings, inactiveCustomerThresholdDays: parseInt(e.target.value) || 0 })}
                                                className="h-12 text-lg font-black text-center border-rose-500/20 bg-white/50 rounded-2xl"
                                            />
                                            <span className="font-bold text-rose-700/60 uppercase text-xs tracking-widest">يوم</span>
                                        </div>
                                        <p className="text-[10px] text-rose-800/70 font-medium leading-relaxed">
                                            سيظهر تنبيه بجانب اسم العميل في القائمة إذا لم يقم بأي عملية شراء خلال هذه الفترة.
                                        </p>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-primary/5 border border-dashed border-primary/30 space-y-3">
                                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                            <Zap size={16} /> معلومة ذكية
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                                            يتم تذكيرك تلقائياً في صفحة "الإشعارات" عند وصول العميل لهذا الحد، مما يساعدك على التواصل معهم وتقديم عروض تحفيزية.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Defaults & Debt Tab */}
                <TabsContent value="defaults">
                    <div className="space-y-6 animate-in zoom-in-95 duration-500">
                        <Card className="border-0 shadow-custom-xl overflow-hidden glass-card rounded-[2.5rem]">
                            <CardHeader className="p-8 h-40 gradient-primary relative overflow-hidden flex flex-col justify-end">
                                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-8 -translate-y-8">
                                    <Settings2 size={160} className="text-white" />
                                </div>
                                <CardTitle className="text-3xl font-black text-white relative z-10">القيم الافتراضية والتحكم</CardTitle>
                                <CardDescription className="text-white/80 font-bold relative z-10 pr-1">قواعد العمل التلقائية للديون والتحصيلات</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="p-3 bg-primary/10 rounded-2xl">
                                                <CreditCard className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg">فترات السداد الآلي</h4>
                                                <p className="text-xs text-muted-foreground font-medium">القيم المستخدمة عند إنشاء سجلات جديدة</p>
                                            </div>
                                        </div>

                                        <div className="space-y-5 pl-4 border-r-4 border-primary/20">
                                            <div className="space-y-2 group">
                                                <Label className="text-sm font-bold flex items-center justify-between">
                                                    <span>استحقاق العميل (المبيعات)</span>
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">DEFAULT TERMS</span>
                                                </Label>
                                                <div className="flex items-center gap-3">
                                                    <Input
                                                        type="number"
                                                        value={invoiceSettings.defaultCustomerTerms || 0}
                                                        onChange={e => setInvoiceSettings({ ...invoiceSettings, defaultCustomerTerms: parseInt(e.target.value) || 0 })}
                                                        className="h-12 font-bold bg-muted/20 border-0 focus:ring-2 ring-primary/20 transition-all rounded-xl"
                                                    />
                                                    <span className="text-sm font-black text-muted-foreground/60 w-12 pt-1">يوم</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 group">
                                                <Label className="text-sm font-bold flex items-center justify-between">
                                                    <span>موعد التوريد (المشتريات)</span>
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">EXPECTED DATE</span>
                                                </Label>
                                                <div className="flex items-center gap-3">
                                                    <Input
                                                        type="number"
                                                        value={invoiceSettings.defaultSupplierTerms || 0}
                                                        onChange={e => setInvoiceSettings({ ...invoiceSettings, defaultSupplierTerms: parseInt(e.target.value) || 0 })}
                                                        className="h-12 font-bold bg-muted/20 border-0 focus:ring-2 ring-primary/20 transition-all rounded-xl"
                                                    />
                                                    <span className="text-sm font-black text-muted-foreground/60 w-12 pt-1">يوم</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="p-3 bg-amber-500/10 rounded-2xl">
                                                <HandCoins className="w-6 h-6 text-amber-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg">تحكمات الإشعارات السريعة</h4>
                                                <p className="text-xs text-muted-foreground font-medium">ضبط ذكاء التنبيهات وإجراءات "تأكيد السداد"</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8 pl-4 border-r-4 border-amber-500/20">
                                            <div className="space-y-3">
                                                <Label className="text-sm font-black text-amber-900/80">الحد الأدنى لمبلغ التنبيه</Label>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 relative">
                                                        <Input
                                                            type="number"
                                                            value={invoiceSettings.minDebtNotificationAmount || 0}
                                                            onChange={e => setInvoiceSettings({ ...invoiceSettings, minDebtNotificationAmount: parseInt(e.target.value) || 0 })}
                                                            className="h-14 font-black text-xl text-center bg-amber-500/5 border-amber-500/20 rounded-[1.25rem] pr-12 focus:border-amber-500/40"
                                                        />
                                                        <HandCoins size={20} className="absolute right-4 top-4 text-amber-500/40" />
                                                    </div>
                                                    <div className="h-14 flex items-center px-4 bg-amber-500 rounded-[1.25rem] text-white font-black text-lg shadow-lg shadow-amber-500/20">ج.م</div>
                                                </div>
                                                <p className="text-[11px] text-amber-900/60 font-bold leading-relaxed pr-2">
                                                    إخفاء تنبيهات الديون التي تقل قيمتها عن هذا المبلغ من قائمة الإشعارات لتجنب الإزعاج بالمبالغ الزهيدة.
                                                </p>
                                            </div>

                                            <div className="p-5 rounded-3xl bg-primary/5 border border-dashed border-primary/30 flex items-start gap-3">
                                                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 animate-pulse" />
                                                <p className="text-xs font-bold leading-relaxed text-primary/80">
                                                    ملاحظة: تفعيل خيار "تأكيد السداد" من الإشعارات يستخدم وسيلة الدفع "نقداً" (Cash) تلقائياً لتحقيق أقصى سرعة في التحصيل.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
