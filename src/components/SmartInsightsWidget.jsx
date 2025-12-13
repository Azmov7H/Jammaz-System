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
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Lightbulb className="text-yellow-500" /> رؤى ذكية (Smart Insights)
            </h3>
            <div className="grid gap-4">
                {insights.map((insight, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/60 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow"
                    >
                        <div className={`p-2 rounded-full ${insight.bg}`}>
                            <insight.icon className={insight.color} size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">{insight.title}</h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{insight.message}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
