import Treasury from '@/models/Treasury';
import TreasuryTransaction from '@/models/TreasuryTransaction';

export async function processTreasuryTransaction({ amount, type, description, referenceType, referenceId, userId }) {
    // Ensure Treasury exists
    let treasury = await Treasury.findOne();
    if (!treasury) {
        treasury = await Treasury.create({ balance: 0 });
    }

    // Calculate Balance Update
    const balanceChange = type === 'INCOME' ? amount : -amount;

    if (type === 'EXPENSE' && treasury.balance < amount) {
        throw new Error(`Insufficient funds. Current Balance: ${treasury.balance}`);
    }

    // Update Treasury Balance
    treasury.balance += balanceChange;
    treasury.lastUpdated = new Date();
    await treasury.save();

    // Create Transaction Record
    const transaction = await TreasuryTransaction.create({
        type,
        amount,
        description,
        referenceType,
        referenceId,
        createdBy: userId
    });

    return { treasury, transaction };
}
