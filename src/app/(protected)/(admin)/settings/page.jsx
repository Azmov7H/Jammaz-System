"use client"
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Settings as SettingsIcon,
    Palette,
    Bell,
    Sparkles,
    Settings2,
    Building2,
    Check,
    Loader2
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { RoleGate } from '@/components/auth/RoleGate';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { GeneralSettingsTab } from '@/components/settings/GeneralSettingsTab';
import { InvoiceDesignTab } from '@/components/settings/InvoiceDesignTab';
import { AlertsSettingsTab } from '@/components/settings/AlertsSettingsTab';
import { GrowthSettingsTab } from '@/components/settings/GrowthSettingsTab';
import { DefaultsSettingsTab } from '@/components/settings/DefaultsSettingsTab';

const TAB_TRIGGER_CLASS = "rounded-2xl py-4 font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl shadow-primary/20";

export default function SettingsPage() {
    const { invoiceSettings, setInvoiceSettings, loading, loadSettings, handleSave } = useInvoiceSettings();
    const [, setActiveTab] = useState('general');

    useEffect(() => {
        loadSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <RoleGate permission="settings:manage">
        <div className="min-h-screen bg-foreground/1020 space-y-8 p-4 md:p-8 rounded-[2rem]" dir="rtl">
            {/* Ambient Background Effect */}

            {/* Page Header */}
            <PageHeader
                title="الإعدادات"
                subtitle="تحكم في هوية مؤسستك وقواعد النظام والسياسات المالية"
                icon={SettingsIcon}
                actions={
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="h-14 px-8 rounded-2xl font-bold text-lg gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 transition-all active:scale-95 group"
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

            <Tabs defaultValue="general" className="w-full max-w-6xl 2xl:max-w-[1400px] mx-auto" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-2 bg-white/[0.02] border border-white/5 rounded-[2rem] glass-card mb-12 shadow-2xl">
                    <TabsTrigger value="general" className={TAB_TRIGGER_CLASS}>
                        <Building2 className="w-5 h-5 ml-2" /> البيانات العامة
                    </TabsTrigger>
                    <TabsTrigger value="design" className={TAB_TRIGGER_CLASS}>
                        <Palette className="w-5 h-5 ml-2" /> هوية الفاتورة
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className={TAB_TRIGGER_CLASS}>
                        <Bell className="w-5 h-5 ml-2" /> التنبيهات
                    </TabsTrigger>
                    <TabsTrigger value="growth" className={TAB_TRIGGER_CLASS}>
                        <Sparkles className="w-5 h-5 ml-2" /> النمو والولاء
                    </TabsTrigger>
                    <TabsTrigger value="defaults" className={TAB_TRIGGER_CLASS}>
                        <Settings2 className="w-5 h-5 ml-2" /> القيم الافتراضية
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <GeneralSettingsTab settings={invoiceSettings} onChange={setInvoiceSettings} />
                </TabsContent>

                <TabsContent value="design">
                    <InvoiceDesignTab settings={invoiceSettings} onChange={setInvoiceSettings} />
                </TabsContent>

                <TabsContent value="alerts">
                    <AlertsSettingsTab settings={invoiceSettings} onChange={setInvoiceSettings} />
                </TabsContent>

                <TabsContent value="growth">
                    <GrowthSettingsTab settings={invoiceSettings} onChange={setInvoiceSettings} />
                </TabsContent>

                <TabsContent value="defaults">
                    <DefaultsSettingsTab settings={invoiceSettings} onChange={setInvoiceSettings} />
                </TabsContent>
            </Tabs>
        </div >
        </RoleGate>
    );
}
