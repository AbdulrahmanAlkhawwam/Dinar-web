import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type { User } from '@/lib/schemas/user';

import { EditUserForm } from './user-forms';

const me: User = {
  id: 'me',
  name: 'Admin',
  email: 'admin@example.com',
  phone: null,
  avatar: null,
  role: 'ADMIN',
  createdAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

function renderForm(isSelf: boolean) {
  const onDone = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <EditUserForm user={me} isSelf={isSelf} onDone={onDone} />
    </QueryClientProvider>,
  );
  return onDone;
}

afterEach(() => vi.restoreAllMocks());

describe('EditUserForm', () => {
  // The role control is locked on your own account. Locking it must not drop
  // the role from the submission, or every self-edit fails validation.
  test('saves your own profile with your role unchanged', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ...me, name: 'Renamed' }), { status: 200 }));
    const user = userEvent.setup();
    const onDone = renderForm(true);

    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Renamed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({ name: 'Renamed', role: 'ADMIN' });
  });

  test('locks your own role, and says why', () => {
    renderForm(true);

    expect(screen.getByRole('combobox', { name: 'Role' })).toBeDisabled();
    expect(screen.getByText('You cannot change your own role.')).toBeInTheDocument();
  });

  test('lets you change someone else’s role', () => {
    renderForm(false);

    expect(screen.getByRole('combobox', { name: 'Role' })).toBeEnabled();
  });
});
