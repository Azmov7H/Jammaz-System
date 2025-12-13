'use client';

import { useState } from 'react';
import { LayoutDashboard, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/dashboard');
                router.refresh();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('حدث خطأ بالاتصال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-slate-900 p-8 text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
                        <LayoutDashboard size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">مخازن الجماز</h1>
                    <p className="text-slate-400">سجل الدخول للمتابعة</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>البريد الإلكتروني</Label>
                            <Input
                                type="email"
                                required
                                className="text-right"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>كلمة المرور</Label>
                            <Input
                                type="password"
                                required
                                className="text-right"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={loading}>
                            {loading ? 'جاري التحقق...' : 'دخول'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-xs text-slate-400">
                        &copy; 2025 جميع الحقوق محفوظة
                    </div>
                </div>
            </div>
        </div>
    );
}
