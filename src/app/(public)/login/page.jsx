'use client';

import { useState } from 'react';
import { Sparkles, LogIn, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LoginBackground } from '@/components/auth/LoginBackground';

import { api } from '@/lib/api-utils';
import { useQueryClient } from '@tanstack/react-query';

export default function LoginPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await api.post('/api/auth/login', formData);
            console.log('[Login] Success Response:', data);
            await queryClient.invalidateQueries({ queryKey: ['user-session'] });

            toast.success('تم تسجيل الدخول بنجاح');
            // Use window.location.href for a hard redirect to ensure cookies are picked up and session is fresh
            window.location.href = '/';
        } catch (err) {
            console.error('[Login] Failed:', err);
            const errorMessage = err.message || 'فشل تسجيل الدخول';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0f0f1e]">
            <LoginBackground />

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                    {/* Right Side - Logo & Branding */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="order-2 lg:order-1 text-center lg:text-right space-y-8"
                    >
                        {/* Logo */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                            className="inline-block"
                        >
                            <div className="relative group">
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-[3rem] blur-2xl opacity-60"
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        opacity: [0.6, 0.8, 0.6]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />
                                <div className="relative w-32 h-32 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-purple-500/50 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-6xl font-black text-white">ج</span>
                                    <Sparkles className="absolute top-2 right-2 h-6 w-6 text-white/60 animate-pulse" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-4"
                        >
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black">
                                <span className="bg-gradient-to-l from-purple-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    مخازن الجماز
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-foreground/60 font-medium max-w-md mx-auto lg:mx-0 lg:mr-auto">
                                نظام إدارة المخازن الذكي والمتكامل
                            </p>
                        </motion.div>

                        {/* Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 lg:mr-auto"
                        >
                            {[
                                { icon: '📊', text: 'تقارير تفصيلية' },
                                { icon: '🔐', text: 'أمان عالي' },
                                { icon: '⚡', text: 'سرعة فائقة' },
                                { icon: '📱', text: 'متجاوب تماماً' }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 + i * 0.1 }}
                                    className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5 hover:border-purple-500/40 transition-all duration-300 hover:scale-105"
                                >
                                    <div className="text-2xl mb-2">{feature.icon}</div>
                                    <div className="text-sm font-bold text-foreground/80">{feature.text}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Left Side - Login Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="order-1 lg:order-2"
                    >
                        <div className="glass-card p-8 md:p-10 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] shadow-2xl backdrop-blur-xl">
                            {/* Form Header */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-center mb-8"
                            >
                                <h2 className="text-3xl md:text-4xl font-black mb-2 bg-gradient-to-l from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                    تسجيل الدخول
                                </h2>
                                <p className="text-foreground/60 text-sm font-medium">
                                    أدخل بياناتك للوصول إلى لوحة التحكم
                                </p>
                            </motion.div>

                            {/* Form */}
                            <form onSubmit={handleLogin} className="space-y-6">
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400 text-sm rounded-2xl text-center font-bold backdrop-blur-sm"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email Input */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="space-y-2"
                                >
                                    <Label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                                        <Mail size={16} className="text-purple-500" />
                                        البريد الإلكتروني
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="email"
                                            required
                                            className="h-14 pr-12 text-right glass-card bg-white/5 border-white/10 focus:border-purple-500/50 focus:bg-white/10 transition-all rounded-2xl text-base font-medium"
                                            placeholder="example@domain.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5 pointer-events-none" />
                                    </div>
                                </motion.div>

                                {/* Password Input */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="space-y-2"
                                >
                                    <Label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                                        <Lock size={16} className="text-purple-500" />
                                        كلمة المرور
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="h-14 pr-12 pl-12 text-right glass-card bg-white/5 border-white/10 focus:border-purple-500/50 focus:bg-white/10 transition-all rounded-2xl text-base font-medium"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5 pointer-events-none" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </motion.div>

                                {/* Submit Button */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 text-base font-black bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="animate-spin" size={20} />
                                                جاري التحقق...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <LogIn size={20} />
                                                تسجيل الدخول
                                            </span>
                                        )}
                                    </Button>
                                </motion.div>
                            </form>

                            {/* Footer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="mt-8 text-center"
                            >
                                <div className="flex items-center justify-center gap-2 text-xs text-foreground/40 font-medium">
                                    <Sparkles size={12} className="text-purple-500/60" />
                                    <span>© 2025 جميع الحقوق محفوظة - مخازن الجماز</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
