import { describe, expect, test } from 'vitest';

import { filterUsers, permissionsFor } from './rules';

const user = (id: string, name: string, email: string) => ({ id, name, email });

describe('filterUsers', () => {
  const users = [
    user('1', 'Jane Doe', 'jane@example.com'),
    user('2', 'Omar Haddad', 'omar@dinar.test'),
  ];

  test('matches on name or email, ignoring case', () => {
    expect(filterUsers(users, 'HADD').map((u) => u.id)).toEqual(['2']);
    expect(filterUsers(users, 'example.com').map((u) => u.id)).toEqual(['1']);
  });

  test('returns everyone for an empty or blank query', () => {
    expect(filterUsers(users, '  ')).toHaveLength(2);
  });
});

describe('permissionsFor', () => {
  // Deleting a user cascades to their operations, and demoting yourself
  // takes away the page you are on. Neither is allowed on your own account.
  test('an admin cannot delete or demote themselves', () => {
    expect(permissionsFor({ id: 'me' }, 'me')).toEqual({ canDelete: false, canChangeRole: false });
  });

  test('an admin can delete and re-role anyone else', () => {
    expect(permissionsFor({ id: 'other' }, 'me')).toEqual({ canDelete: true, canChangeRole: true });
  });
});
