'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Package, DollarSign, Users } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-3">
                <SettingsIcon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">الإعدادات</h1>
                    <p className="text-sm text-muted-foreground">تخصيص خصائص النظام</p>
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

                {/* System Settings */}
                <Card className="border shadow-sm md:col-span-2">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            إعدادات النظام
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm">اسم المؤسسة</Label>
                                <Input defaultValue="مخازن الجماز" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">رقم الهاتف</Label>
                                <Input type="tel" placeholder="+20 xxx xxx xxxx" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-sm">العنوان</Label>
                                <Input placeholder="العنوان الكامل للمؤسسة" />
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
