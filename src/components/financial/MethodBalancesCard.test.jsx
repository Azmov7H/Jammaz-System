/**
 * FIN-TAHWEESH-04 (T-13) — the method breakdown shows the isolated
 * set-aside row and the method sum stays consistent with the total.
 */
import { render, screen } from '@testing-library/react';
import { MethodBalancesCard } from './MethodBalancesCard';

describe('MethodBalancesCard tahweesh row', () => {
    test('renders the set-aside balance distinctly from operating channels', () => {
        render(
            <MethodBalancesCard
                breakdown={{ cash: 80000, bank: 0, wallet: 0, instapay: 0, check: 0, tahweesh: 20000 }}
                total={100000}
            />
        );
        expect(screen.getByText('تحويش (مرصود)')).toBeInTheDocument();
        expect(screen.getByText('الرصيد الكلي المعروض: 100,000 ج.م')).toBeInTheDocument();
    });

    test('tolerates a missing tahweesh bucket (old cached payloads)', () => {
        render(<MethodBalancesCard breakdown={{ cash: 500 }} total={500} />);
        expect(screen.getByText('تحويش (مرصود)')).toBeInTheDocument();
    });
});
