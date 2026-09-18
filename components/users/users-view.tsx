'use client';

import { useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { RemoteImage } from '@/components/ui/remote-image';
import { Table, Td, Th } from '@/components/ui/table';
import { TextField } from '@/components/ui/text-field';
import { useDeleteUser, useUsers } from '@/lib/api/users';
import type { User } from '@/lib/schemas/user';
import { filterUsers, permissionsFor } from '@/lib/users/rules';

import { EditUserForm, NewUserForm } from './user-forms';

type Editing = { mode: 'create' } | { mode: 'edit'; user: User } | null;

function joined(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function UsersView({
  currentUserId,
  endpointsOpen,
}: {
  currentUserId: string;
  endpointsOpen: boolean;
}) {
  const users = useUsers();
  const remove = useDeleteUser();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const visible = users.data ? filterUsers(users.data, query) : [];

  const closeDelete = () => {
    setDeleting(null);
    remove.reset();
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-sm text-on-surface-variant">Everyone with a Dinar account.</p>
        </div>
        <Button onClick={() => setEditing({ mode: 'create' })}>Add user</Button>
      </div>

      {endpointsOpen ? (
        <Alert>
          <strong>The API’s user endpoints are not protected.</strong> Anyone
          who can reach the API can list, edit and delete users, or make
          themselves an administrator, without signing in. This notice goes
          away on its own once the backend guards the <code>/users</code>{' '}
          routes.
        </Alert>
      ) : null}

      <TextField
        label="Search"
        type="search"
        placeholder="Name or email"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="max-w-sm"
      />

      {users.isPending ? (
        <p className="text-sm text-on-surface-variant">Loading users…</p>
      ) : users.isError ? (
        <Alert>{users.error.message}</Alert>
      ) : visible.length === 0 ? (
        <EmptyState title={query.trim() ? 'No one matches' : 'No users yet'}>
          {query.trim() ? 'Try a different name or email.' : null}
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Phone</Th>
              <Th>Role</Th>
              <Th>Joined</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((user) => {
              const { canDelete } = permissionsFor(user, currentUserId);
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <RemoteImage
                        src={user.avatar}
                        alt=""
                        fallback={user.name}
                        className="size-10 shrink-0 rounded-full"
                      />
                      <div className="min-w-0">
                        <p className="font-medium">
                          {user.name}
                          {isSelf ? <span className="ml-2 text-xs font-normal text-on-surface-variant">(you)</span> : null}
                        </p>
                        <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap text-on-surface-variant">{user.phone ?? '—'}</Td>
                  <Td>
                    <span
                      className={`rounded-pill px-2.5 py-1 text-xs ${
                        user.role === 'ADMIN'
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {user.role === 'ADMIN' ? 'Administrator' : 'Member'}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-on-surface-variant">{joined(user.createdAt)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="text"
                        onClick={() => setEditing({ mode: 'edit', user })}
                        aria-label={`Edit ${user.name}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => setDeleting(user)}
                        disabled={!canDelete}
                        title={canDelete ? undefined : 'You cannot delete your own account'}
                        aria-label={`Delete ${user.name}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? `Edit ${editing.user.name}` : 'Add user'}
      >
        {editing?.mode === 'create' ? <NewUserForm onDone={() => setEditing(null)} /> : null}
        {editing?.mode === 'edit' ? (
          <EditUserForm
            key={editing.user.id}
            user={editing.user}
            isSelf={editing.user.id === currentUserId}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? ''}?`}
        confirmLabel="Delete user"
        pending={remove.isPending}
        error={remove.isError ? remove.error.message : null}
        onClose={closeDelete}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
      >
        {/* Operation.user is onDelete: Cascade. */}
        This also permanently deletes every operation {deleting?.name} has
        recorded. It cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
