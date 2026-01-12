'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, UserCog, Trash2, Shield } from 'lucide-react';
import { ExportButton } from '@/components/common/ExportButton';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/utils';
import { useUsers } from '@/hooks/useUsers';
import { UserFormDialog } from '@/components/users/UserFormDialog';

export default function UsersPage() {
    const { role } = useUserRole();
    const canManage = role === 'owner' || role === 'manager';
    const canDelete = role === 'owner';

    const { users, isLoading, createUser, updateUser, deleteUser } = useUsers();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleOpenAdd = () => {
        setSelectedUser(null);
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (user) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const handleSubmit = (formData) => {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;

        if (selectedUser) {
            updateUser.mutate({ id: selectedUser._id, data: payload }, {
                onSuccess: () => setIsDialogOpen(false)
            });
        } else {
            createUser.mutate(payload, {
                onSuccess: () => setIsDialogOpen(false)
            });
        }
    };

    const handleDelete = (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        deleteUser.mutate(id);
    };

    const getRoleBadge = (r) => {
        const configs = {
            owner: { variant: 'default', label: 'المالك', className: 'bg-purple-600 hover:bg-purple-700' },
            manager: { variant: 'secondary', label: 'مدير' },
            warehouse: { variant: 'outline', label: 'مخزن', className: 'bg-orange-50 text-orange-700 border-orange-300' },
            cashier: { variant: 'outline', label: 'كاشير' }
        };
        const config = configs[r] || configs.cashier;
        return <Badge variant={config.variant} className={cn(config.className)}>{config.label}</Badge>;
    };

    if (!canManage && !isLoading) {
        return (
            <div className="p-8 text-center animate-fade-in">
                <div className="inline-block p-4 bg-red-50 rounded-full mb-4">
                    <Shield className="w-12 h-12 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">غير مصرح</h3>
                <p className="text-muted-foreground">ليس لديك صلاحية للوصول لهذه الصفحة</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="animate-slide-in-right">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">إدارة المستخدمين</h1>
                    <p className="text-muted-foreground">إضافة وتعديل صلاحيات المستخدمين</p>
                </div>
                <div className="flex gap-2">
                    <ExportButton
                        type="users"
                        data={users}
                        columns={[
                            { header: 'الاسم', key: 'name' },
                            { header: 'البريد', key: 'email' },
                            { header: 'الدور', key: 'role' }
                        ]}
                        pdfTitle="تقرير المستخدمين"
                    />
                    <Button onClick={handleOpenAdd} className="gap-2 gradient-primary border-0 hover-lift shadow-colored animate-scale-in">
                        <Plus size={18} /> مستخدم جديد
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg glass-card shadow-custom-md overflow-hidden hover-lift transition-all duration-300">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">الاسم</TableHead>
                            <TableHead className="text-right">البريد الإلكتروني</TableHead>
                            <TableHead className="text-right">الصلاحية</TableHead>
                            <TableHead className="text-left">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-40 text-center">
                                    <Loader2 className="animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                                    لا يوجد مستخدمين
                                </TableCell>
                            </TableRow>
                        ) : users.map(user => (
                            <TableRow key={user._id} className="transition-all duration-300 hover:bg-muted/50 group">
                                <TableCell className="font-semibold">{user.name}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{user.email}</TableCell>
                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2 justify-end opacity-10 md:opacity-0 group-hover:opacity-100 transition-all">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenEdit(user)}
                                            className="hover-scale hover:bg-primary/10 hover:text-primary"
                                        >
                                            <UserCog size={16} />
                                        </Button>
                                        {canDelete && user.role !== 'owner' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover-scale text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(user._id)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <UserFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                user={selectedUser}
                onSubmit={handleSubmit}
                isPending={createUser.isPending || updateUser.isPending}
            />
        </div>
    );
}

