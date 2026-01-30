'use client';

import * as React from 'react';
import { cn } from '@/utils';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

export function StatCard({
    title,
    value,
    unit,
    icon: Icon,
    subtitle,
    trend,
    trendValue,
    variant = 'primary',
    className
}) {
    const variants = {
        primary: 'from-primary/20 to-primary/5 border-primary/20 text-primary shadow-primary/10',
        success: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-500 shadow-emerald-500/10',
        info: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-500 shadow-blue-500/10',
        warning: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-500 shadow-amber-500/10',
        destructive: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-500 shadow-rose-500/10',
        slate: 'from-slate-500/20 to-slate-500/5 border-slate-500/20 text-slate-400 shadow-slate-500/10',
    };

    return (
        <div
            className={cn(
                "glass-card p-6 rounded-[2.5rem] border overflow-hidden relative group transition-all duration-500",
                "bg-gradient-to-br shadow-2xl hover:scale-[1.02] hover:-translate-y-2",
                variants[variant],
                className
            )}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="flex justify-between items-start relative z-10 mb-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                        {title}
                    </p>
                    {subtitle && <p className="text-sm font-bold opacity-40">{subtitle}</p>}
                </div>
                {Icon && (
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner group-hover:rotate-12 transition-transform">
                        <Icon size={24} />
                    </div>
                )}
            </div>

            <div className="relative z-10 flex items-baseline gap-2">
                <h3 className="text-4xl font-black tabular-nums tracking-tighter">
                    {value}
                </h3>
                {unit && <span className="text-lg font-black opacity-40">{unit}</span>}
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black opacity-40 group-hover:opacity-100 transition-opacity">
                    {trend ? (
                        <>
                            <TrendingUp size={12} className={trend === 'up' ? 'text-emerald-500' : 'text-rose-500'} />
                            <span className={trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}>{trendValue}</span>
                        </>
                    ) : (
                        <>
                            <TrendingUp size={12} />
                            <span>تحديث حيّ</span>
                        </>
                    )}
                </div>
                <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-40 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </div>
        </div>
    );
}
