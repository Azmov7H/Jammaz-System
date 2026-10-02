/**
 * TransactionsTable FIN-REV-01 ACL integration (FE-AUTH-003): the
 * compensating reversal (keep history) action must be owner-only, mirroring
 * backend `POST /api/financial/transaction/:id/reverse`
 * (`roleMiddleware(['owner'])`). Document-backed rows instead surface a muted
 * guidance icon.
 *
 * CJS style — required for jest.mock hoisting under next/jest (SWC).
 */
jest.mock('@/hooks/useUserRole', () => ({
    useUserRole: jest.fn(),
}));

const React = require('react');
const { screen, fireEvent } = require('@testing-library/react');
const { ROLES } = require('@/lib/permissions');
const { useUserRole } = require('@/hooks/useUserRole');
const { TransactionsTable } = require('./TransactionsTable');
const { renderWithProviders } = require('@/test/utils');

const manualTx = {
    _id: '64b000000000000000000001',
    type: 'EXPENSE',
    amount: 500,
    description: 'مصاريف',
    method: 'cash',
    sourceNumber: '',
    referenceType: 'Manual',
    date: '2026-08-30T10:00:00.000Z',
};

function renderTable(role, props = {}) {
    useUserRole.mockReturnValue({ role, loading: false });
    return renderWithProviders(
        React.createElement(TransactionsTable, {
            transactions: props.transactions || [manualTx],
            typeFilter: 'ALL',
            onTypeFilterChange: () => {},
            onTxClick: () => {},
            onReverse: () => {},
            isReversing: false,
            ...props,
        })
    );
}

describe('TransactionsTable reversal ACL (FIN-REV-01)', () => {
    it('shows the reversal action for owner (backend owner-only reverse)', () => {
        renderTable(ROLES.OWNER);
        expect(screen.getByLabelText('عكس المعاملة')).toBeInTheDocument();
    });

    it('hides the reversal action for manager, matching backend 403', () => {
        renderTable(ROLES.MANAGER);
        expect(screen.queryByLabelText('عكس المعاملة')).not.toBeInTheDocument();
    });

    it('shows a muted guidance icon for document-backed rows', () => {
        renderTable(ROLES.OWNER, {
            transactions: [{ ...manualTx, _id: '64b0000000000000000000f1', referenceType: 'Invoice' }],
        });
        expect(screen.getByLabelText('غير قابلة للعكس')).toBeInTheDocument();
        expect(screen.queryByLabelText('عكس المعاملة')).not.toBeInTheDocument();
    });

    it('hides the guidance icon from non-owners', () => {
        renderTable(ROLES.MANAGER, {
            transactions: [{ ...manualTx, _id: '64b0000000000000000000f2', referenceType: 'Invoice' }],
        });
        expect(screen.queryByLabelText('غير قابلة للعكس')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('عكس المعاملة')).not.toBeInTheDocument();
    });

    it('keeps the details action visible for all roles', () => {
        renderTable(ROLES.MANAGER);
        expect(screen.getByLabelText('تفاصيل الحركة')).toBeInTheDocument();
    });
});

describe('TransactionsTable pagination', () => {
    function renderPaged(props = {}) {
        useUserRole.mockReturnValue({ role: ROLES.OWNER, loading: false });
        return renderWithProviders(
            React.createElement(TransactionsTable, {
                transactions: [manualTx],
                typeFilter: 'ALL',
                onTypeFilterChange: () => {},
                onTxClick: () => {},
                onReverse: () => {},
                isReversing: false,
                page: 1,
                totalPages: 3,
                total: 250,
                onPageChange: () => {},
                ...props,
            })
        );
    }

    it('shows page position and total, advancing on next', () => {
        const onPageChange = jest.fn();
        renderPaged({ onPageChange });
        expect(screen.getByText(/صفحة 1 من 3/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /التالي/ }));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('disables previous on the first page and next on the last', () => {
        renderPaged({ page: 1 });
        expect(screen.getByRole('button', { name: /السابق/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /التالي/ })).not.toBeDisabled();
    });

    it('hides the pager for a single page', () => {
        renderPaged({ totalPages: 1 });
        expect(screen.queryByRole('button', { name: /التالي/ })).not.toBeInTheDocument();
    });
});

describe('TransactionsTable unified collections', () => {
    const ucTx = {
        ...manualTx,
        _id: '64b000000000000000000002',
        type: 'INCOME',
        referenceType: 'UnifiedCollection',
        referenceId: { _id: '64c000000000000000000001', name: 'عميل مجمع' },
        description: 'تحصيل مجمع - عميل مجمع',
    };

    it('links the customer instead of showing ---', () => {
        useUserRole.mockReturnValue({ role: ROLES.MANAGER, loading: false });
        renderWithProviders(
            React.createElement(TransactionsTable, {
                transactions: [ucTx],
                typeFilter: 'ALL',
                onTypeFilterChange: () => {},
                onTxClick: () => {},
                onReverse: () => {},
                isReversing: false,
            })
        );
        expect(screen.getByRole('link', { name: 'عميل مجمع' })).toHaveAttribute(
            'href',
            '/customers/64c000000000000000000001'
        );
        expect(screen.getAllByText('تحصيل مجمع').length).toBeGreaterThanOrEqual(2);
    });
});
