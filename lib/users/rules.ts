/** Case-insensitive match on name or email. A blank query matches everyone. */
export function filterUsers<T extends { name: string; email: string }>(users: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return users;
  }
  return users.filter(
    (user) => user.name.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle),
  );
}

/**
 * What the signed-in admin may do to a user. Their own account is protected:
 * deleting it cascades to their operations and ends the session mid-page,
 * and demoting it removes the page they are standing on.
 */
export function permissionsFor(target: { id: string }, currentUserId: string) {
  const isSelf = target.id === currentUserId;
  return { canDelete: !isSelf, canChangeRole: !isSelf };
}
