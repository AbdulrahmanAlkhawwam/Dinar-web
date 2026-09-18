import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import type { Currency } from '@/lib/schemas/currency';
import type { Operation } from '@/lib/schemas/operation';

import { OperationForm } from './operation-form';

const stamp = '2026-09-01T00:00:00.000Z';
const usd: Currency = { id: 'usd', code: 'USD', name: 'US Dollar', symbol: '$', exchangeRateFromUSD: 1, createdAt: stamp, updatedAt: stamp };
const syp: Currency = { id: 'syp', code: 'SYP', name: 'Syrian Pound', symbol: 'SP', exchangeRateFromUSD: 15000, createdAt: stamp, updatedAt: stamp };

const existing: Operation = {
  id: 'op1',
  userId: 'u1',
  type: 'EXPENSE',
  title: 'Groceries',
  description: null,
  amount: 28000,
  currencyId: 'syp',
  exchangeRate: 14000, // the rate at the time, not today's 15000
  amountInUSD: 2,
  operationDate: '2026-09-10T00:00:00.000Z',
  currency: syp,
  createdAt: stamp,
  updatedAt: stamp,
};

function renderForm(props: { operation?: Operation } = {}) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <OperationForm currencies={[usd, syp]} onDone={vi.fn()} {...props} />
    </QueryClientProvider>,
  );
}

describe('OperationForm', () => {
  test('previews the USD figure at the chosen currency’s rate', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText('Currency'), 'syp');
    await user.type(screen.getByLabelText('Amount'), '30000');

    expect(screen.getByText(/Recorded as/)).toHaveTextContent(
      'Recorded as $2.00 at 15,000 SYP per dollar.',
    );
  });

  test('keeps the original rate when only the amount is edited', async () => {
    const user = userEvent.setup();
    renderForm({ operation: existing });

    const amount = screen.getByLabelText('Amount');
    await user.clear(amount);
    await user.type(amount, '42000');

    expect(screen.getByText(/Recorded as/)).toHaveTextContent('$3.00 at 14,000 SYP');
    expect(screen.queryByText(/replaces the rate/)).not.toBeInTheDocument();
  });

  test('warns that switching currency replaces the recorded rate', async () => {
    const user = userEvent.setup();
    renderForm({ operation: existing });

    await user.selectOptions(screen.getByLabelText('Currency'), 'usd');

    expect(screen.getByText(/replaces the rate this operation was recorded at/)).toBeInTheDocument();
  });

  test('explains what is missing instead of sending an empty form', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Add operation' }));

    expect(await screen.findByText('Enter a title')).toBeInTheDocument();
    expect(screen.getByText('Enter an amount')).toBeInTheDocument();
    expect(screen.getByText('Choose a currency')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
