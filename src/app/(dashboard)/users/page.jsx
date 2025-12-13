'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, UserCog, Trash2, Key } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export default function UsersPage() {
    const { role } = useUserRole();
    const canManage = role === 'owner' || role === 'manager';
    const canDelete = role === 'owner';

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '', email: '', password: '', role: 'cashier' });

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            // toast.error('فشل جلب المستخدمين');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const resetForm = () => {
        setFormData({ id: '', name: '', email: '', password: '', role: 'cashier' });
        setEditMode(false);
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (user) => {
        setFormData({
            id: user._id,
            name: user.name,
            email: user.email,
            password: '', // Should be empty
            role: user.role
        });
        setEditMode(true);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editMode ? `/api/users/${formData.id}` : '/api/users';
            const method = editMode ? 'PUT' : 'POST';

            const body = { ...formData };
            if (editMode && !body.password) delete body.password; // Don't send empty password on edit

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Operation failed');
            }

            toast.success(editMode ? 'تم تحديث المستخدم' : 'تم إضافة المستخدم');
            setIsDialogOpen(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('تم حذف المستخدم');
            fetchUsers();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getRoleBadge = (r) => {
        switch (r) {
            case 'owner': return <Badge className="bg-purple-600">المالك</Badge>;
            case 'manager': return <Badge className="bg-blue-600">مدير</Badge>;
            case 'warehouse': return <Badge className="bg-orange-600">مخزن</Badge>;
            default: return <Badge className="bg-slate-500">كاشير</Badge>;
        }
    };

    if (!canManage && !loading) return <div className="p-8 text-center text-red-500">غير مصرح لك بالوصول لهذه الصفحة</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#1B3C73]">إدارة المستخدمين</h1>
                    <p className="text-sm text-slate-500">إضافة وتعديل صلاحيات المستخدمين</p>
                </div>
                <Button onClick={handleOpenAdd} className="bg-[#1B3C73] gap-2"><Plus size={18} /> مستخدم جديد</Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="text-right">الاسم</TableHead>
                            <TableHead className="text-right">البريد الإلكتروني</TableHead>
                            <TableHead className="text-right">الصلاحية</TableHead>
                            <TableHead className="text-left">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        ) : users.map(user => (
                            <TableRow key={user._id}>
                                <TableCell className="font-bold">{user.name}</TableCell>
                                <TableCell className="font-mono text-xs">{user.email}</TableCell>
                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(user)}><UserCog size={16} /></Button>
                                        {canDelete && user.role !== 'owner' && (
                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(user._id)}><Trash2 size={16} /></Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>{editMode ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>الاسم</Label>
                            <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="اسم الموظف" />
                        </div>
                        <div className="space-y-2">
                            <Label>البريد الإلكتروني</Label>
                            <Input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" disabled={editMode} />
                        </div>
                        <div className="space-y-2">
                            <Label>كلمة المرور {editMode && '(اتركها فارغة لعدم التغيير)'}</Label>
                            <div className="relative">
                                <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="pr-10" required={!editMode} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>الصلاحية / الدور</Label>
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="cashier">كاشير (مبيعات فقط)</option>
                                <option value="warehouse">أمين مخزن (مخزون فقط)</option>
                                <option value="manager">مدير (صلاحيات كاملة عدا الحذف الحساس)</option>
                                {role === 'owner' && <option value="owner">مالك (Owner)</option>}
                            </select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="bg-[#1B3C73] w-full">حفظ البيانات</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
