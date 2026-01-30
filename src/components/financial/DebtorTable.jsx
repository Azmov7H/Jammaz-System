'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import Link from "next/link"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, User, FileText, Coins, Phone, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DebtorTable({ debtors, onUnifiedCollection }) {
    const router = useRouter();

    return (
        <div className="overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-white/5 hover:bg-transparent h-16">
                        <TableHead className="font-black text-xs uppercase tracking-widest text-right px-6">العميل / المورد</TableHead>
                        <TableHead className="font-black text-xs uppercase tracking-widest text-right">رقم الهاتف</TableHead>
                        <TableHead className="font-black text-xs uppercase tracking-widest text-right">عدد الفواتير</TableHead>
                        <TableHead className="font-black text-xs uppercase tracking-widest text-right">إجمالي المديونية</TableHead>
                        <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {debtors.map((item) => (
                        <TableRow key={item._id} className="border-white/5 hover:bg-muted/50 transition-colors group h-20">
                            <TableCell className="px-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <User size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <Link
                                            href={`/customers/${item.debtor._id}`}
                                            className="hover:text-primary transition-colors font-black text-foreground text-sm"
                                        >
                                            {item.debtor.name}
                                        </Link>
                                        <Badge variant="outline" className="w-fit text-[9px] h-4 px-1 border-white/10 text-muted-foreground">
                                            {item.debtor.priceType === 'wholesale' ? 'جملة' : 'قطاعي'}
                                        </Badge>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 text-muted-foreground bg-muted/20 w-fit px-2 py-1 rounded-lg">
                                    <Phone size={12} />
                                    <span className="font-mono text-xs font-bold">{item.debtor.phone || '-'}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <FileText size={14} className="text-muted-foreground" />
                                    <span className="font-mono text-sm font-black">{item.invoicesCount}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 font-black text-foreground">
                                        <span className="font-mono text-lg text-red-500">{item.totalDebt.toLocaleString()}</span>
                                        <span className="text-[10px] text-muted-foreground italic">ج.م</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="px-4">
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        size="sm"
                                        className="h-9 px-4 rounded-xl gap-2 font-black bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all"
                                        onClick={() => onUnifiedCollection(item)}
                                    >
                                        <Coins size={16} /> تحصيل
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                                        onClick={() => router.push(`/customers/${item.debtor._id}`)}
                                    >
                                        <ArrowUpRight size={18} />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {debtors.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-64 text-center text-muted-foreground font-black opacity-50">
                                <div className="flex flex-col items-center gap-4">
                                    <User size={48} />
                                    <p>لا يوجد عملاء مديونين حالياً</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div >
    );
}
