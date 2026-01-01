

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function KPICard({ title, value, unit, icon: Icon, subtitle, variant = 'default' }) {
    const variants = {
        primary: 'border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:from-primary/15',
        success: 'border-green-500/20 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent hover:from-green-500/15',
        warning: 'border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent hover:from-amber-500/15',
        destructive: 'border-red-500/20 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent hover:from-red-500/15',
        secondary: 'border-secondary/20 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent hover:from-secondary/15',
        default: 'border-border bg-card hover:bg-muted/20'
    };

    const iconColors = {
        primary: 'text-primary',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-amber-600 dark:text-amber-400',
        destructive: 'text-red-600 dark:text-red-400',
        secondary: 'text-secondary',
        default: 'text-muted-foreground'
    };

    const iconBgColors = {
        primary: 'bg-primary/10',
        success: 'bg-green-500/10',
        warning: 'bg-amber-500/10',
        destructive: 'bg-red-500/10',
        secondary: 'bg-secondary/10',
        default: 'bg-muted/20'
    };

    return (
        <Card className={cn('border shadow-custom-md hover-lift hover:shadow-custom-xl transition-all duration-300 overflow-hidden relative group', variants[variant])}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className={cn('p-2 rounded-lg transition-transform duration-300 group-hover:scale-110', iconBgColors[variant])}>
                        <Icon className={cn('w-5 h-5', iconColors[variant])} />
                    </div>
                </div>
                <div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground group-hover:scale-105 transition-transform duration-300 inline-block">
                        {value}
                        <span className="text-lg">{unit}</span>
                    </p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
