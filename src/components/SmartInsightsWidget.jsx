'use client';

import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

export default function SmartInsightsWidget({ stats }) {
    // Mock Logic for demonstration if real detailed stats aren't passed yet
    // In a real scenario, this would analyze trends from `stats` props.

    const insights = [
        {
            icon: TrendingUp,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            title: 'فرصة نمو',
            message: 'مبيعات "شنيور بوش" ارتفعت بنسبة 20% هذا الأسبوع. يُنصح بزيادة المخزون.'
        },
        {
            icon: AlertTriangle,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            title: 'تنبيه مخزون',
            message: '3 منتجات وصلت للحد الأدنى في المحل. قم بعمل تحويل مخزني لتجنب توقف البيع.'
        },
        {
            icon: DollarSign,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            title: 'سيولة مالية',
            message: 'رصيد الخزينة ممتاز. هل فكرت في الاستثمار في بضاعة جديدة؟'
        }
    ];

    return (
        <div className="space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Lightbulb className="text-yellow-500" />
                </div>
                <span className="bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">
                    رؤى ذكية (Smart Insights)
                </span>
            </h3>
            <div className="grid gap-4">
                {insights.map((insight, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-card border p-4 rounded-xl shadow-custom-md hover:shadow-custom-xl transition-all duration-300 flex items-start gap-4 group hover-lift cursor-pointer overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className={`p-2 rounded-full ${insight.bg} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                            <insight.icon className={insight.color} size={20} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{insight.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.message}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
