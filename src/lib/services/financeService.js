import Treasury from '@/models/Treasury';
import TreasuryTransaction from '@/models/TreasuryTransaction';
import dbConnect from '@/lib/db';

export const FinanceService = {
    /**
     * Record a transaction (Income/Expense) using a robust pattern
     */
    async recordTransaction({ amount, type, description, referenceType, referenceId, userId }) {
        await dbConnect();

        if (amount <= 0) throw new Error('Amount must be positive');

        // Ensure Treasury
        let treasury = await Treasury.findOne();
        if (!treasury) {
            treasury = await Treasury.create({ balance: 0 });
        }

        if (type === 'EXPENSE') {
            if (treasury.balance < amount) {
                throw new Error(`Insufficient treasury balance: ${treasury.balance}`);
            }
            treasury.balance -= amount;
        } else if (type === 'INCOME') {
            treasury.balance += amount;
        } else {
            throw new Error('Invalid transaction type');
        }

        treasury.lastUpdated = new Date();
        await treasury.save();

        const transaction = await TreasuryTransaction.create({
            type,
            amount,
            description,
            referenceType,
            referenceId,
            createdBy: userId,
            balanceAfter: treasury.balance // Snapshot balance
        });

        return { transaction, balance: treasury.balance };
    },

    async getBalance() {
        await dbConnect();
        const treasury = await Treasury.findOne();
        return treasury ? treasury.balance : 0;
    }
};
