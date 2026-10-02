/**
 * FIN-REV-01 (T-REV) — ReversalActionButton behavior.
 * Owner sees the action and can confirm a compensating reversal with an
 * optional reason; managers never see it.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ReversalActionButton } from './ReversalActionButton';

jest.mock('@/hooks/useUserRole', () => ({ useUserRole: jest.fn() }));
jest.mock('@/hooks/useFinancial', () => ({
    useReverseTransaction: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@tanstack/react-query', () => ({
    useMutation: () => ({ mutate: jest.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

const { useUserRole } = require('@/hooks/useUserRole');
const { ROLES } = require('@/lib/permissions');

const ROW = {
    txId: '64b0000000000000000000a1',
    referenceType: 'Manual',
    isReversed: false,
    isReversal: false,
};

describe('ReversalActionButton', () => {
    afterEach(() => jest.clearAllMocks());

    it('renders nothing for non-owners', () => {
        useUserRole.mockReturnValue({ role: ROLES.MANAGER, loading: false });
        render(<ReversalActionButton tx={ROW} />);
        expect(screen.queryByLabelText('عكس المعاملة')).not.toBeInTheDocument();
    });

    it('opens the confirmation dialog for an owner', () => {
        useUserRole.mockReturnValue({ role: ROLES.OWNER, loading: false });
        render(<ReversalActionButton tx={ROW} />);
        fireEvent.click(screen.getByLabelText('عكس المعاملة'));
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('shows a muted guidance icon for document-backed rows', () => {
        useUserRole.mockReturnValue({ role: ROLES.OWNER, loading: false });
        render(<ReversalActionButton tx={{ ...ROW, referenceType: 'Invoice' }} />);
        expect(screen.getByLabelText('غير قابلة للعكس')).toBeInTheDocument();
    });
});