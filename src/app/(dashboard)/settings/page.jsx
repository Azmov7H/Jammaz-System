"use client"
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Package, DollarSign, Users, Palette, CreditCard, QrCode, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
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
        invoiceTemplate: 'modern'
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
                toast.success('تم حفظ إعدادات الفاتورة بنجاح');
            } else {
                toast.error('فشل في حفظ الإعدادات');
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl pb-10">
            <div className="flex items-center gap-3">
                <SettingsIcon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">الإعدادات</h1>
                    <p className="text-sm text-muted-foreground">تخصيص خصائص النظام وتصاميم الفواتير</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stock Settings */}
                <Card className="border shadow-sm">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            حدود المخزون
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm">الحد الأدنى الافتراضي للطلب</Label>
                            <Input type="number" defaultValue={5} />
                            <p className="text-xs text-muted-foreground">عدد الوحدات التي تُطلق تنبيه النقص</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">فترة التوريد المتوقعة (أيام)</Label>
                            <Input type="number" defaultValue={3} />
                            <p className="text-xs text-muted-foreground">الوقت المتوقع لوصول الطلبيات</p>
                        </div>
                        <Separator />
                        <Button className="w-full">حفظ إعدادات المخزون</Button>
                    </CardContent>
                </Card>

                {/* Financial Settings */}
                <Card className="border shadow-sm">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            الإعدادات المالية
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm">العملة الافتراضية</Label>
                            <Input defaultValue="ج.م" disabled />
                            <p className="text-xs text-muted-foreground">الجنيه المصري</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">الضريبة (٪)</Label>
                            <Input type="number" defaultValue={0} min={0} max={100} />
                            <p className="text-xs text-muted-foreground">نسبة الضريبة المضافة على المبيعات</p>
                        </div>
                        <Separator />
                        <Button className="w-full">حفظ الإعدادات المالية</Button>
                    </CardContent>
                </Card>

                {/* Invoice Design Settings */}
                <Card className="border shadow-sm md:col-span-2">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary" />
                            تصميم الفاتورة المطبوعة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-primary border-b pb-2">
                                    <Users className="w-4 h-4" /> معلومات المؤسسة
                                </h3>
                                <div className="space-y-2">
                                    <Label className="text-sm">اسم المؤسسة في الفاتورة</Label>
                                    <Input
                                        value={invoiceSettings.companyName}
                                        onChange={e => setInvoiceSettings({ ...invoiceSettings, companyName: e.target.value })}
                                        placeholder="مثال: مخازن الجماز"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm">رقم الهاتف</Label>
                                        <Input
                                            value={invoiceSettings.phone}
                                            onChange={e => setInvoiceSettings({ ...invoiceSettings, phone: e.target.value })}
                                            placeholder="+20 xxx xxx xxxx"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm">البريد الإلكتروني</Label>
                                        <Input
                                            value={invoiceSettings.email}
                                            onChange={e => setInvoiceSettings({ ...invoiceSettings, email: e.target.value })}
                                            placeholder="info@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm">العنوان</Label>
                                    <Input
                                        value={invoiceSettings.address}
                                        onChange={e => setInvoiceSettings({ ...invoiceSettings, address: e.target.value })}
                                        placeholder="القاهرة، مدينة نصر..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-primary border-b pb-2">
                                    <Palette className="w-4 h-4" /> التخصيص البصري
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm">اللون الأساسي</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                className="w-12 h-10 p-1"
                                                value={invoiceSettings.primaryColor}
                                                onChange={e => setInvoiceSettings({ ...invoiceSettings, primaryColor: e.target.value })}
                                            />
                                            <Input
                                                value={invoiceSettings.primaryColor}
                                                onChange={e => setInvoiceSettings({ ...invoiceSettings, primaryColor: e.target.value })}
                                                className="flex-1 font-mono text-xs uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm">لون ترويسة الجدول</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                className="w-12 h-10 p-1"
                                                value={invoiceSettings.headerBgColor}
                                                onChange={e => setInvoiceSettings({ ...invoiceSettings, headerBgColor: e.target.value })}
                                            />
                                            <Input
                                                value={invoiceSettings.headerBgColor}
                                                onChange={e => setInvoiceSettings({ ...invoiceSettings, headerBgColor: e.target.value })}
                                                className="flex-1 font-mono text-xs uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm flex items-center gap-2">
                                                <QrCode className="w-4 h-4 text-muted-foreground" /> إظهار QR Code
                                            </Label>
                                            <p className="text-xs text-muted-foreground">للعرض السريع لبيانات الفاتورة</p>
                                        </div>
                                        <Switch
                                            checked={invoiceSettings.showQRCode}
                                            onCheckedChange={checked => setInvoiceSettings({ ...invoiceSettings, showQRCode: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-muted-foreground" /> إظهار الشعار
                                            </Label>
                                            <p className="text-xs text-muted-foreground">عرض شعار المؤسسة في الأعلى</p>
                                        </div>
                                        <Switch
                                            checked={invoiceSettings.showLogo}
                                            onCheckedChange={checked => setInvoiceSettings({ ...invoiceSettings, showLogo: checked })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm">نص تذييل الفاتورة</Label>
                                    <Input
                                        value={invoiceSettings.footerText}
                                        onChange={e => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
                                        placeholder="مثال: شكراً لثقتكم بنا"
                                    />
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSaveInvoiceSettings}
                                disabled={loading}
                                className="gradient-primary border-0"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                                حفظ إعدادات التصميم
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* System Settings */}
                <Card className="border shadow-sm md:col-span-2">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            إعدادات النظام العامة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm">اسم النظام</Label>
                                <Input defaultValue="نظام مبيعات الجماز" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">رقم الدعم الفني</Label>
                                <Input type="tel" placeholder="+20 xxx xxx xxxx" />
                            </div>
                        </div>
                        <Separator />
                        <Button className="w-full md:w-auto">حفظ التغييرات</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

