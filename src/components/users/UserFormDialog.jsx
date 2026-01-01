'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, Loader2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

export function UserFormDialog({ open, onOpenChange, user, onSubmit, isPending }) {
    const { role: currentUserRole } = useUserRole();
    const isEdit = !!user;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'cashier'
    });

    useEffect(() => {
        if (open) {
            if (user) {
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    password: '', // Don't show password
                    role: user.role || 'cashier'
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    role: 'cashier'
                });
            }
        }
    }, [open, user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>الاسم</Label>
                        <Input
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="اسم الموظف"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>البريد الإلكتروني</Label>
                        <Input
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@example.com"
                            disabled={isEdit}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>كلمة المرور {isEdit && '(اتركها فارغة لعدم التغيير)'}</Label>
                        <div className="relative">
                            <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground ml-2" size={16} />
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="pr-10"
                                required={!isEdit}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>الصلاحية / الدور</Label>
                        <Select
                            value={formData.role}
                            onValueChange={val => setFormData({ ...formData, role: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cashier">كاشير (مبيعات فقط)</SelectItem>
                                <SelectItem value="warehouse">أمين مخزن (مخزون فقط)</SelectItem>
                                <SelectItem value="manager">مدير (صلاحيات كاملة)</SelectItem>
                                {currentUserRole === 'owner' && <SelectItem value="owner">مالك (Owner)</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            حفظ البيانات
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
