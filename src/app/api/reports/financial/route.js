import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AccountingEntry from '@/models/AccountingEntry';
import { ACCOUNTS } from '@/lib/services/accountingService';

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);

        // Defaults to this month if no dates provided
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : startOfMonth;
        const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : new Date();

        // 1. Fetch all Revenue Entries (Credits to Revenue Accounts)
        const revenueEntries = await AccountingEntry.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate },
                    creditAccount: { $in: [ACCOUNTS.SALES_REVENUE, ACCOUNTS.OTHER_INCOME, ACCOUNTS.SURPLUS_INCOME] }
                }
            },
            {
                $group: {
                    _id: '$creditAccount',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // 2. Fetch all Expense/COGS Entries (Debits to Expense Accounts)
        const expenseAccountsList = [
            ACCOUNTS.COGS,
            ACCOUNTS.RENT_EXPENSE,
            ACCOUNTS.UTILITIES_EXPENSE,
            ACCOUNTS.SALARIES_EXPENSE,
            ACCOUNTS.SUPPLIES_EXPENSE,
            ACCOUNTS.OTHER_EXPENSE,
            ACCOUNTS.SHORTAGE_EXPENSE
        ];

        const expenseEntries = await AccountingEntry.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate },
                    debitAccount: { $in: expenseAccountsList }
                }
            },
            {
                $group: {
                    _id: '$debitAccount',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Transform to readable format
        const revenueMap = revenueEntries.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.total }), {});
        const expenseMap = expenseEntries.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.total }), {});

        const totalRevenue = Object.values(revenueMap).reduce((a, b) => a + b, 0);
        const cogs = expenseMap[ACCOUNTS.COGS] || 0;
        const grossProfit = totalRevenue - cogs;

        const operatingExpenses = expenseAccountsList
            .filter(acc => acc !== ACCOUNTS.COGS) // Exclude COGS from OpEx
            .reduce((sum, acc) => sum + (expenseMap[acc] || 0), 0);

        const netProfit = grossProfit - operatingExpenses;

        return NextResponse.json({
            period: { startDate, endDate },
            financials: {
                revenue: {
                    total: totalRevenue,
                    breakdown: revenueMap
                },
                cogs,
                grossProfit,
                operatingExpenses: {
                    total: operatingExpenses,
                    breakdown: Object.fromEntries(
                        Object.entries(expenseMap).filter(([k]) => k !== ACCOUNTS.COGS)
                    )
                },
                netProfit
            }
        });

    } catch (error) {
        console.error('Financial Report Error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
